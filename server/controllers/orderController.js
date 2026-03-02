const Order = require('../models/Order');
const Product = require('../models/Product');
const Rider = require('../models/Rider');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const { nanoid } = require('nanoid');
const { createError } = require('../middleware/errorHandler');
const R = require('../utils/apiResponse');
const { calculateCartTotals, parseWeightKg, DELIVERY_RATE_PER_ITEM } = require('../utils/deliveryPricing');

// ── Order State Machine ──────────────────────────────────────────────────────
const VALID_TRANSITIONS = {
  'Placed': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Packed', 'Cancelled'],
  'Packed': ['Dispatched', 'Cancelled'],
  'Dispatched': ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
  'Delivered': [],
  'Cancelled': [],
};

function canTransition(from, to) {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

function emitOrderUpdate(orderId, data) {
  try {
    const { getIO } = require('../config/socket');
    getIO().to(`order:${orderId}`).emit('order:update', data);
  } catch (_) { /* socket not critical */ }
}

// ── Create Order ─────────────────────────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const { items, customerName, customerPhone, deliveryAddress, notes, paymentMethod, idempotencyKey } = req.body;

    // Idempotency: prevent duplicate order submissions
    if (idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey });
      if (existing) {
        return R.success(res, existing, 'Order already placed');
      }
    }

    // Price snapshot + stock check (atomic per item)
    const stockUpdates = [];
    const itemsWithSnapshot = [];
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        for (const rb of stockUpdates) {
          await Product.findByIdAndUpdate(rb.id, { $inc: { stock: rb.qty } });
        }
        const p = await Product.findById(item.product).select('name stock');
        return next(createError(400, p
          ? `Insufficient stock for "${p.name}". Available: ${p.stock}`
          : `Product not found: ${item.product}`
        ));
      }
      stockUpdates.push({ id: item.product, qty: item.quantity });
      itemsWithSnapshot.push({
        product: updated._id,
        name: updated.name,
        price: updated.price,
        weight: parseWeightKg(updated.weight),
        quantity: item.quantity,
        image: updated.image || '',
      });
    }

    // Calculate totals server-side
    const totals = calculateCartTotals(
      itemsWithSnapshot.map(i => ({ priceSnapshot: i.price, weightSnapshot: i.weight, quantity: i.quantity })),
      req.body.discountAmount || 0
    );

    // Auto-assign available rider
    const availableRider = await Rider.findOne({ status: 'Available', isOnline: true }) ||
      await Rider.findOne({ status: 'Available' });

    // Generate delivery OTP
    const deliveryOTP = String(Math.floor(100000 + Math.random() * 900000));
    const orderId = `HX-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;

    const order = await Order.create({
      orderId,
      idempotencyKey: idempotencyKey || undefined,
      items: itemsWithSnapshot,
      totalAmount: totals.grandTotal,
      subtotal: totals.subtotal,
      deliveryCharge: totals.deliveryCharge,
      totalWeight: totals.totalWeight,
      gstAmount: totals.gstAmount,
      discountAmount: req.body.discountAmount || 0,
      couponCode: req.body.couponCode || '',
      customerName: customerName || 'Contractor',
      customerPhone: customerPhone || '',
      deliveryAddress: deliveryAddress || '',
      notes: notes || '',
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: !paymentMethod || paymentMethod === 'COD' ? 'COD' : 'Paid',
      deliveryTimeEstimate: '45 minutes',
      assignedRider: availableRider?._id || null,
      status: 'Placed',
      statusHistory: [{ status: 'Placed', changedBy: req.user?._id || null }],
      customer: req.user?._id || null,
      deliveryOTP,
    });

    // Increment coupon usage
    if (req.body.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: req.body.couponCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    // Clear cart after order
    if (req.user) {
      await Cart.findOneAndUpdate({ user: req.user._id }, {
        items: [], couponCode: '', discountAmount: 0, subtotal: 0, deliveryCharge: 0, gstAmount: 0, grandTotal: 0
      });
    }

    if (availableRider) {
      await Rider.findByIdAndUpdate(availableRider._id, { status: 'Delivering' });
      // Notify rider via socket
      try {
        const { getIO } = require('../config/socket');
        getIO().to(`rider:${availableRider._id}`).emit('order:new', { orderId: order._id, orderCode: orderId });
      } catch (_) { }
    }

    const populated = await order.populate('assignedRider', 'name phone vehicleNo rating photo');
    // Send delivery OTP to customer (in prod: SMS)
    console.log(`📦 Order ${orderId} created. Delivery OTP: ${deliveryOTP}`);
    return R.created(res, populated, 'Order placed successfully');
  } catch (err) { next(err); }
};

// ── Get Orders ───────────────────────────────────────────────────────────────
exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, rider, from, to, search, customer } = req.query;
    const filter = {};

    // Customers can only see their own orders
    if (req.user.role === 'customer') {
      filter.customer = req.user._id;
    } else {
      if (status) filter.status = status;
      if (rider) filter.assignedRider = rider;
      if (customer) filter.customer = customer;
      if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(to);
      }
      if (search) filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('assignedRider', 'name phone vehicleNo status photo rating')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Order.countDocuments(filter),
    ]);

    return R.paginated(res, orders, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

// ── Get Single Order ──────────────────────────────────────────────────────────
exports.getOrder = async (req, res, next) => {
  try {
    const query = req.params.id.startsWith('HX-')
      ? { orderId: req.params.id }
      : { _id: req.params.id };
    const order = await Order.findOne(query)
      .populate('assignedRider', 'name phone vehicleNo status photo rating location')
      .lean();
    if (!order) return next(createError(404, 'Order not found'));
    // Customer can only see their own order
    if (req.user.role === 'customer' && String(order.customer) !== String(req.user._id)) {
      return next(createError(403, 'Access denied'));
    }
    return R.success(res, order);
  } catch (err) { next(err); }
};

// ── Update Order Status ───────────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status: newStatus, riderId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, 'Order not found'));

    if (!canTransition(order.status, newStatus)) {
      return next(createError(400,
        `Cannot transition from "${order.status}" to "${newStatus}". Valid: ${VALID_TRANSITIONS[order.status]?.join(', ') || 'none'}`
      ));
    }

    // Security: riders can only update orders assigned to them
    if (req.user.role === 'rider') {
      if (!order.assignedRider || String(order.assignedRider) !== String(req.user.riderId || req.user._id)) {
        return next(createError(403, 'You can only update orders assigned to you'));
      }
    }

    if (riderId && riderId !== String(order.assignedRider)) {
      const rider = await Rider.findById(riderId);
      if (!rider) return next(createError(404, 'Rider not found'));
      order.assignedRider = riderId;
    }

    if (newStatus === 'Out for Delivery' && order.assignedRider) {
      await Rider.findByIdAndUpdate(order.assignedRider, { status: 'Delivering' });
    }
    if (newStatus === 'Delivered' && order.assignedRider) {
      await Rider.findByIdAndUpdate(order.assignedRider, {
        status: 'Available',
        $inc: { totalDeliveries: 1, earnings: DELIVERY_RATE_PER_ITEM, todayEarnings: DELIVERY_RATE_PER_ITEM },
      });
      order.paymentStatus = 'Paid';
    }

    order.status = newStatus;
    order.statusHistory.push({ status: newStatus, changedBy: req.user?._id || null });
    await order.save();

    const populated = await order.populate('assignedRider', 'name phone vehicleNo status photo rating');
    emitOrderUpdate(order._id, { status: newStatus, orderId: order.orderId, updatedAt: new Date() });
    return R.success(res, populated, `Order status updated to "${newStatus}"`);
  } catch (err) { next(err); }
};

// ── Verify Delivery OTP ───────────────────────────────────────────────────────
exports.verifyDeliveryOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, 'Order not found'));
    if (order.status !== 'Out for Delivery') return next(createError(400, 'Order is not out for delivery'));
    if (order.deliveryOTPUsed) return next(createError(400, 'OTP already used'));
    if (String(otp) !== String(order.deliveryOTP)) return next(createError(400, 'Invalid OTP'));

    order.deliveryOTPUsed = true;
    order.status = 'Delivered';
    order.paymentStatus = 'Paid';
    order.statusHistory.push({ status: 'Delivered', changedBy: req.user?._id || null, note: 'OTP verified' });
    await order.save();

    if (order.assignedRider) {
      await Rider.findByIdAndUpdate(order.assignedRider, {
        status: 'Available',
        $inc: { totalDeliveries: 1, earnings: DELIVERY_RATE_PER_ITEM, todayEarnings: DELIVERY_RATE_PER_ITEM },
      });
    }

    emitOrderUpdate(order._id, { status: 'Delivered', orderId: order.orderId });
    return R.success(res, order, 'Delivery confirmed!');
  } catch (err) { next(err); }
};

// ── Rate Order ────────────────────────────────────────────────────────────────
exports.rateOrder = async (req, res, next) => {
  try {
    const { productRating, riderRating, ratingReview } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, 'Order not found'));
    if (order.status !== 'Delivered') return next(createError(400, 'Can only rate delivered orders'));
    if (req.user.role === 'customer' && String(order.customer) !== String(req.user._id)) {
      return next(createError(403, 'Access denied'));
    }

    order.productRating = productRating;
    order.riderRating = riderRating;
    order.ratingReview = ratingReview || '';
    await order.save();

    // Update rider's average rating
    if (riderRating && order.assignedRider) {
      const riderOrders = await Order.find({ assignedRider: order.assignedRider, riderRating: { $ne: null } });
      const avgRating = riderOrders.reduce((s, o) => s + o.riderRating, 0) / riderOrders.length;
      await Rider.findByIdAndUpdate(order.assignedRider, { rating: Math.round(avgRating * 10) / 10 });
    }

    return R.success(res, order, 'Rating submitted');
  } catch (err) { next(err); }
};

// ── Cancel Order ──────────────────────────────────────────────────────────────
exports.cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, 'Order not found'));

    if (!canTransition(order.status, 'Cancelled')) {
      return next(createError(400, `Cannot cancel an order that is "${order.status}"`));
    }
    // Customer can only cancel their own orders
    if (req.user?.role === 'customer' && String(order.customer) !== String(req.user._id)) {
      return next(createError(403, 'Access denied'));
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
    if (order.assignedRider) {
      await Rider.findByIdAndUpdate(order.assignedRider, { status: 'Available' });
    }
    if (order.couponCode) {
      await Coupon.findOneAndUpdate({ code: order.couponCode }, { $inc: { usedCount: -1 } });
    }

    order.status = 'Cancelled';
    order.cancelReason = reason || 'Cancelled';
    order.cancelledAt = new Date();
    order.paymentStatus = order.paymentStatus === 'Paid' ? 'Refunded' : 'Pending';
    order.statusHistory.push({ status: 'Cancelled', changedBy: req.user?._id || null, note: reason });
    await order.save();

    emitOrderUpdate(order._id, { status: 'Cancelled', orderId: order.orderId });
    return R.success(res, order, 'Order cancelled. Stock restored.');
  } catch (err) { next(err); }
};

// ── Return Request ────────────────────────────────────────────────────────────
exports.requestReturn = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, 'Order not found'));
    if (order.status !== 'Delivered') return next(createError(400, 'Only delivered orders can be returned'));
    if (order.returnRequest) return next(createError(400, 'Return already requested'));
    if (req.user?.role === 'customer' && String(order.customer) !== String(req.user._id)) {
      return next(createError(403, 'Access denied'));
    }

    order.returnRequest = { reason: reason || 'Defective product', status: 'requested', requestedAt: new Date() };
    await order.save();
    return R.success(res, order, 'Return request submitted');
  } catch (err) { next(err); }
};

// ── Reorder ───────────────────────────────────────────────────────────────────
exports.reorder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, 'Order not found'));

    // Add items back to cart
    if (req.user) {
      const Cart = require('../models/Cart');
      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product || product.stock < 1) continue;
        const idx = cart.items.findIndex(i => String(i.product) === String(item.product));
        if (idx >= 0) {
          cart.items[idx].quantity = Math.min(cart.items[idx].quantity + item.quantity, product.stock);
        } else {
          cart.items.push({
            product: product._id,
            name: product.name,
            priceSnapshot: product.price,
            weightSnapshot: parseWeightKg(product.weight),
            image: product.image || '',
            quantity: Math.min(item.quantity, product.stock),
          });
        }
      }
      await cart.save();
      return R.success(res, cart, 'Items added to cart');
    }
    return R.success(res, { items: order.items }, 'Reorder items');
  } catch (err) { next(err); }
};

// ── Self-Assign Order (Rider accepts an unassigned order) ────────────────
exports.selfAssignOrder = async (req, res, next) => {
  try {
    const riderId = req.user.riderId;
    if (!riderId) return next(createError(400, 'Your account is not linked to a rider profile'));

    // Atomically assign only if currently unassigned and in 'Placed' status
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, assignedRider: null, status: 'Placed' },
      {
        assignedRider: riderId,
        status: 'Confirmed',
        $push: { statusHistory: { status: 'Confirmed', changedBy: req.user._id, note: 'Self-assigned by rider' } },
      },
      { new: true }
    ).populate('assignedRider', 'name phone vehicleNo status photo rating');

    if (!order) return next(createError(400, 'Order is no longer available for assignment'));

    await Rider.findByIdAndUpdate(riderId, { status: 'Delivering' });
    emitOrderUpdate(order._id, { status: 'Confirmed', orderId: order.orderId });
    return R.success(res, order, 'Order accepted!');
  } catch (err) { next(err); }
};

// ── Stats (Admin) ─────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalOrders, ordersToday, activeOrders,
      revenue, todayRevenue,
      lowStockItems, dailyOrders, topProducts, recentOrders, riderStats,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ status: { $in: ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery'] } }),
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      require('../models/Product').find({ stock: { $lte: 10 } }).select('name stock category').sort({ stock: 1 }).limit(10).lean(),
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%m/%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.name', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { totalQty: -1 } },
        { $limit: 5 },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(5)
        .populate('assignedRider', 'name')
        .select('orderId customerName status totalAmount createdAt assignedRider').lean(),
      require('../models/Rider').find().select('name status totalDeliveries rating earnings').lean(),
    ]);

    return R.success(res, {
      totalOrders, ordersToday, activeOrders,
      revenue: revenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      lowStock: lowStockItems.length, lowStockItems,
      dailyOrders, topProducts,
      recentActivity: recentOrders.map(o => ({
        id: o._id, orderId: o.orderId, customer: o.customerName,
        status: o.status, amount: o.totalAmount, rider: o.assignedRider?.name || '', time: o.createdAt,
      })),
      riders: riderStats,
    });
  } catch (err) { next(err); }
};
