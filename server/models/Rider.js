const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  phone:       { type: String, required: true },
  vehicleNo:   { type: String, default: '' },
  status:      { type: String, enum: ['Available', 'Delivering', 'Off Duty'], default: 'Available' },
  totalDeliveries: { type: Number, default: 0 },
  rating:      { type: Number, default: 4.5 },
  photo:       { type: String, default: '' },
  isOnline:    { type: Boolean, default: false },
  // Earnings
  earnings:    { type: Number, default: 0 },
  todayEarnings:   { type: Number, default: 0 },
  weeklyDeliveries:{ type: Number, default: 0 },
  // Location (for live tracking)
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    updatedAt: { type: Date, default: null },
  },
}, { timestamps: true });

module.exports = mongoose.model('Rider', riderSchema);
