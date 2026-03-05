const Coupon = require('../models/Coupon');

// GET all coupons (admin)
exports.getCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ success: true, data: coupons });
    } catch (err) { next(err); }
};

// POST create coupon (admin)
exports.createCoupon = async (req, res, next) => {
    try {
        const { code, discountType, discountValue, minOrderAmount, maxUses, expiryDate, description } = req.body;
        if (!code || !discountType || !discountValue) {
            return res.status(400).json({ success: false, message: 'code, discountType, and discountValue are required' });
        }
        const coupon = await Coupon.create({ code: code.toUpperCase(), discountType, discountValue, minOrderAmount, maxUses, expiryDate, description });
        res.status(201).json({ success: true, data: coupon });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        next(err);
    }
};

// PUT update coupon (admin)
exports.updateCoupon = async (req, res, next) => {
    try {
        if (req.body.code) req.body.code = req.body.code.toUpperCase();
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.json({ success: true, data: coupon });
    } catch (err) { next(err); }
};

// DELETE coupon (admin)
exports.deleteCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.json({ success: true, message: 'Coupon deleted' });
    } catch (err) { next(err); }
};

// POST validate coupon (public — called at checkout)
exports.validateCoupon = async (req, res, next) => {
    try {
        const { code, orderAmount } = req.body;
        const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });

        // Expiry check
        if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
            return res.status(400).json({ success: false, message: 'This coupon has expired' });
        }
        // Max uses check
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            return res.status(400).json({ success: false, message: 'This coupon has reached maximum usage' });
        }
        // Min order check
        if (orderAmount < coupon.minOrderAmount) {
            return res.status(400).json({ success: false, message: `Minimum order of ₹${coupon.minOrderAmount} required for this coupon` });
        }

        const discount = coupon.discountType === 'percentage'
            ? Math.round((orderAmount * coupon.discountValue) / 100)
            : coupon.discountValue;

        res.json({
            success: true,
            data: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discount: Math.min(discount, orderAmount),
                description: coupon.description,
            }
        });
    } catch (err) { next(err); }
};
