const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  weight: { type: Number, default: 0 },   // kg snapshot
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  note: { type: String, default: '' },
}, { _id: false });

const returnRequestSchema = new mongoose.Schema({
  reason: { type: String, default: '' },
  status: { type: String, enum: ['requested', 'approved', 'rejected'], default: 'requested' },
  requestedAt: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  idempotencyKey: { type: String, unique: true, sparse: true },  // prevent duplicate submissions

  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  subtotal: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  totalWeight: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String, default: '' },

  status: {
    type: String,
    enum: ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Placed',
  },
  statusHistory: [statusHistorySchema],

  assignedRider: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', default: null },

  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'COD', 'Refunded'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['COD', 'UPI', 'Card', 'Wallet'], default: 'COD' },

  // OTP for delivery confirmation
  deliveryOTP: { type: String, default: '' },
  deliveryOTPUsed: { type: Boolean, default: false },

  // Customer
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  customerName: { type: String, default: 'Contractor' },
  customerPhone: { type: String, default: '' },
  deliveryAddress: { type: String, default: '' },
  deliveryTimeEstimate: { type: String, default: '45 minutes' },
  notes: { type: String, default: '' },

  // Ratings
  productRating: { type: Number, min: 1, max: 5, default: null },
  riderRating: { type: Number, min: 1, max: 5, default: null },
  ratingReview: { type: String, default: '' },

  // Return
  returnRequest: { type: returnRequestSchema, default: null },

  // Cancellation
  cancelReason: { type: String, default: '' },
  cancelledAt: { type: Date, default: null },
}, { timestamps: true });

// Indexes
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ assignedRider: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);
