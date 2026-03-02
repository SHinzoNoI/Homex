const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:          { type: String, required: true },
  priceSnapshot: { type: Number, required: true },
  weightSnapshot:{ type: Number, default: 0 },  // kg
  image:         { type: String, default: '' },
  category:      { type: String, default: '' },
  brand:         { type: String, default: '' },
  quantity:      { type: Number, required: true, min: 1 },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items:          [cartItemSchema],
  couponCode:     { type: String, default: '' },
  discountAmount: { type: Number, default: 0 },
  // Computed fields (recalculated on every update)
  subtotal:       { type: Number, default: 0 },
  totalWeight:    { type: Number, default: 0 },   // kg
  deliveryCharge: { type: Number, default: 0 },
  gstAmount:      { type: Number, default: 0 },
  grandTotal:     { type: Number, default: 0 },
}, { timestamps: true });

cartSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('Cart', cartSchema);
