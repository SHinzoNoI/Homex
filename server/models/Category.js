const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '📦' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
