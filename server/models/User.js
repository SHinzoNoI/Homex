const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Site' },   // "Home", "Site A", etc.
  line1: { type: String, required: true },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: null },
  email: { type: String, lowercase: true, trim: true, default: null },
  password: { type: String, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'rider', 'customer'], default: 'customer' },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', default: null },
  isActive: { type: Boolean, default: true },

  // Customer profile fields
  gstNumber: { type: String, default: '' },
  addresses: [addressSchema],
  siteNames: [{ type: String }],
  wallet: { type: Number, default: 0 },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Partial indexes: only index non-null values, avoiding duplicate-null conflicts on MongoDB 5+
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
