const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { calculateCartTotals, parseWeightKg } = require('../utils/deliveryPricing');
const { createError } = require('../middleware/errorHandler');
const R = require('../utils/apiResponse');

async function recalcAndSave(cart, couponCode) {
  // Refresh price/weight snapshots from DB
  const productIds = cart.items.map(i => i.product);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = {};
  products.forEach(p => { productMap[String(p._id)] = p; });

  cart.items = cart.items.map(item => {
    const p = productMap[String(item.product)];
    if (p) {
      item.priceSnapshot = p.price;
      item.weightSnapshot = parseWeightKg(p.weight);
      item.name = p.name;
      item.image = p.image || '';
      item.category = p.category || '';
      item.brand = p.brand || '';
    }
    return item;
  }).filter(item => productMap[String(item.product)]); // remove deleted products

  // Coupon discount
  let discountAmount = 0;
  if (couponCode || cart.couponCode) {
    const code = couponCode || cart.couponCode;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (coupon && (!coupon.expiryDate || new Date() <= coupon.expiryDate) &&
        (!coupon.maxUses || coupon.usedCount < coupon.maxUses)) {
      const subtotal = cart.items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
      if (subtotal >= (coupon.minOrderAmount || 0)) {
        discountAmount = coupon.discountType === 'percentage'
          ? Math.round(subtotal * coupon.discountValue / 100)
          : coupon.discountValue;
        cart.couponCode = code.toUpperCase();
      }
    } else {
      cart.couponCode = '';
    }
  }

  const totals = calculateCartTotals(cart.items.map(i => ({
    priceSnapshot: i.priceSnapshot,
    weightSnapshot: i.weightSnapshot,
    quantity: i.quantity,
  })), discountAmount);

  Object.assign(cart, totals, { discountAmount });
  await cart.save();
  return cart;
}

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    } else {
      cart = await recalcAndSave(cart);
    }
    return R.success(res, cart);
  } catch (err) { next(err); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return next(createError(404, 'Product not found'));
    if (product.stock < quantity) return next(createError(400, `Only ${product.stock} in stock`));

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existingIdx = cart.items.findIndex(i => String(i.product) === String(productId));
    if (existingIdx >= 0) {
      const newQty = cart.items[existingIdx].quantity + quantity;
      if (newQty > product.stock) return next(createError(400, `Max available stock is ${product.stock}`));
      cart.items[existingIdx].quantity = newQty;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        priceSnapshot: product.price,
        weightSnapshot: parseWeightKg(product.weight),
        image: product.image || '',
        category: product.category || '',
        brand: product.brand || '',
        quantity,
      });
    }

    cart = await recalcAndSave(cart);
    return R.success(res, cart, 'Item added to cart');
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return next(createError(404, 'Cart not found'));

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => String(i.product) !== String(productId));
    } else {
      const product = await Product.findById(productId);
      if (product && quantity > product.stock) {
        return next(createError(400, `Only ${product.stock} in stock`));
      }
      const idx = cart.items.findIndex(i => String(i.product) === String(productId));
      if (idx < 0) return next(createError(404, 'Item not in cart'));
      cart.items[idx].quantity = quantity;
    }

    const updated = await recalcAndSave(cart);
    return R.success(res, updated, 'Cart updated');
  } catch (err) { next(err); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return next(createError(404, 'Cart not found'));

    cart.items = cart.items.filter(i => String(i.product) !== String(productId));
    const updated = await recalcAndSave(cart);
    return R.success(res, updated, 'Item removed');
  } catch (err) { next(err); }
};

exports.applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return next(createError(400, 'Coupon code required'));
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return next(createError(404, 'Cart not found'));

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return next(createError(404, 'Invalid or expired coupon'));
    if (coupon.expiryDate && new Date() > coupon.expiryDate) return next(createError(400, 'Coupon has expired'));
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return next(createError(400, 'Coupon usage limit reached'));
    if (cart.subtotal < (coupon.minOrderAmount || 0)) {
      return next(createError(400, `Minimum order amount ₹${coupon.minOrderAmount} required`));
    }

    cart.couponCode = code.toUpperCase();
    const updated = await recalcAndSave(cart, code);
    return R.success(res, updated, `Coupon applied! You save ₹${updated.discountAmount}`);
  } catch (err) { next(err); }
};

exports.removeCoupon = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return next(createError(404, 'Cart not found'));
    cart.couponCode = '';
    cart.discountAmount = 0;
    const updated = await recalcAndSave(cart);
    return R.success(res, updated, 'Coupon removed');
  } catch (err) { next(err); }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], couponCode: '', discountAmount: 0, subtotal: 0, deliveryCharge: 0, gstAmount: 0, grandTotal: 0 }
    );
    return R.success(res, null, 'Cart cleared');
  } catch (err) { next(err); }
};
