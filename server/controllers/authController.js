const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Rider = require('../models/Rider');
const { createError } = require('../middleware/errorHandler');

const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role, riderId: user.riderId || null },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  riderId: user.riderId,
  gstNumber: user.gstNumber,
  addresses: user.addresses,
  siteNames: user.siteNames,
  wallet: user.wallet,
});

// ── Email/Password Login (admin & rider) ─────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(createError(400, 'Email and password are required'));

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(createError(401, 'Invalid email or password'));
    }
    if (!user.isActive) return next(createError(403, 'Your account has been deactivated'));

    const token = signToken(user);
    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: formatUser(user),
    });
  } catch (err) { next(err); }
};

// ── Register (admin only for admin/rider, public for customer) ───────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    // Public registration is always customer
    const role = 'customer';

    if (email) {
      const existing = await User.findOne({ email });
      if (existing) return next(createError(409, 'Email already registered'));
    }
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) return next(createError(409, 'Phone already registered'));
    }

    const user = await User.create({ name, email: email || null, password: password || undefined, phone: phone || null, role });
    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: formatUser(user),
    });
  } catch (err) { next(err); }
};

// ── OTP: Send ────────────────────────────────────────────────────────────────
exports.sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''))) {
      return next(createError(400, 'Valid 10-digit Indian mobile number required'));
    }
    const cleanPhone = phone.replace(/\s+/g, '');

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);

    // Delete any existing OTP for this phone, create fresh one
    await OTP.deleteMany({ phone: cleanPhone });
    await OTP.create({
      phone: cleanPhone,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // In production: send via MSG91/Fast2SMS/Twilio
    // For demo: return OTP in response (remove in production!)
    const isDev = process.env.NODE_ENV !== 'production';

    console.log(`📱 OTP for ${cleanPhone}: ${otp}`);

    res.json({
      success: true,
      message: `OTP sent to ${cleanPhone}`,
      ...(isDev && { otp }), // Only in dev/demo
    });
  } catch (err) { next(err); }
};

// ── OTP: Verify ──────────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) return next(createError(400, 'Phone and OTP are required'));

    const cleanPhone = phone.replace(/\s+/g, '');
    const record = await OTP.findOne({ phone: cleanPhone, verified: false });

    if (!record) return next(createError(400, 'OTP not found or already used. Please request a new one.'));
    if (record.attempts >= 5) return next(createError(429, 'Too many attempts. Request a new OTP.'));
    if (new Date() > record.expiresAt) return next(createError(400, 'OTP has expired. Please request a new one.'));

    const isValid = await record.verify(otp);
    if (!isValid) {
      return next(createError(400, `Invalid OTP. ${5 - record.attempts} attempts remaining.`));
    }

    // Mark as verified
    record.verified = true;
    await record.save();

    // Find or create user
    let user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      user = await User.create({
        phone: cleanPhone,
        name: name || `User ${cleanPhone.slice(-4)}`,
        role: 'customer',
      });
    }

    if (!user.isActive) return next(createError(403, 'Your account has been deactivated'));

    const token = signToken(user);
    res.json({
      success: true,
      message: user.createdAt === user.updatedAt ? 'Account created successfully' : 'Logged in successfully',
      token,
      user: formatUser(user),
      isNewUser: user.createdAt.getTime() === user.updatedAt.getTime(),
    });
  } catch (err) { next(err); }
};

// ── OTP: Verify for Order Confirmation (no login session created) ─────────────
exports.verifyOrderOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return next(createError(400, 'Phone and OTP are required'));

    const cleanPhone = phone.replace(/\s+/g, '');
    const record = await OTP.findOne({ phone: cleanPhone });
    if (!record) return next(createError(400, 'OTP not found or expired. Please request a new one.'));
    if (record.attempts >= 5) return next(createError(429, 'Too many attempts. Request a new OTP.'));
    if (new Date() > record.expiresAt) return next(createError(400, 'OTP has expired. Please request a new one.'));

    const isValid = await record.verify(otp);
    if (!isValid) {
      return next(createError(400, `Invalid OTP. ${5 - record.attempts} attempts remaining.`));
    }

    // Mark OTP as used
    record.verified = true;
    await record.save();

    // Return a short-lived verification token (5 min) — not a login token
    const verificationToken = jwt.sign(
      { phone: cleanPhone, purpose: 'order_confirm' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({
      success: true,
      message: 'Phone verified successfully',
      verificationToken,
    });
  } catch (err) { next(err); }
};

// ── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: formatUser(req.user) });
  } catch (err) { next(err); }
};

// ── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, gstNumber, addresses, siteNames, email } = req.body;
    const allowed = {};
    if (name) allowed.name = name;
    if (gstNumber !== undefined) allowed.gstNumber = gstNumber;
    if (addresses !== undefined) allowed.addresses = addresses;
    if (siteNames !== undefined) allowed.siteNames = siteNames;
    if (email) allowed.email = email;

    const user = await User.findByIdAndUpdate(req.user._id, allowed, { new: true, runValidators: true });
    res.json({ success: true, user: formatUser(user), message: 'Profile updated' });
  } catch (err) { next(err); }
};

// ── Admin: Create Staff (admin/rider accounts) ───────────────────────────────
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!['admin', 'rider'].includes(role)) {
      return next(createError(400, 'Role must be admin or rider'));
    }
    const existing = await User.findOne({ email });
    if (existing) return next(createError(409, 'Email already registered'));

    const user = await User.create({ name, email, password, role });

    // If rider, create a matching Rider document and link it
    if (role === 'rider') {
      const riderDoc = await Rider.create({
        name,
        phone: req.body.phone || '',
        vehicleNo: req.body.vehicleNo || '',
        status: 'Available',
        isOnline: false,
      });
      user.riderId = riderDoc._id;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: `${role} account created`,
      user: formatUser(user),
    });
  } catch (err) { next(err); }
};
