const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  phone:     { type: String, required: true },
  otpHash:   { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },  // TTL index
  attempts:  { type: Number, default: 0 },
  verified:  { type: Boolean, default: false },
}, { timestamps: true });

otpSchema.index({ phone: 1 });

otpSchema.methods.verify = async function(otp) {
  if (this.verified) return false;
  if (new Date() > this.expiresAt) return false;
  if (this.attempts >= 5) return false;
  this.attempts += 1;
  await this.save();
  return bcrypt.compare(String(otp), this.otpHash);
};

module.exports = mongoose.model('OTP', otpSchema);
