const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['Cement', 'Steel', 'Bricks', 'Sand', 'Timber', 'Plumbing', 'Electrical', 'Paint', 'Tools', 'Safety', 'Other'] },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  unit: { type: String, default: 'piece' },
  weight: { type: String, default: '' },
  brand: { type: String, default: '' },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

// Indexes for performance
productSchema.index({ category: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' }); // full-text search

module.exports = mongoose.model('Product', productSchema);

