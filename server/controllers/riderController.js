const Rider = require('../models/Rider');
const Order = require('../models/Order');

exports.getRiders = async (req, res) => {
    try {
        const riders = await Rider.find().sort({ name: 1 });
        res.json({ success: true, data: riders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createRider = async (req, res) => {
    try {
        const { name, phone, vehicleNo, status, rating, photo } = req.body;
        if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone are required' });
        const rider = await Rider.create({ name, phone, vehicleNo, status, rating, photo });
        res.status(201).json({ success: true, data: rider });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteRider = async (req, res) => {
    try {
        const rider = await Rider.findByIdAndDelete(req.params.id);
        if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });
        res.json({ success: true, message: 'Rider deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateRider = async (req, res) => {
    try {
        const rider = await Rider.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });
        res.json({ success: true, data: rider });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getRiderStats = async (req, res) => {
    try {
        const rider = await Rider.findById(req.params.id);
        if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

        // Get orders assigned to this rider (by ObjectId)
        const orders = await Order.find({ assignedRider: rider._id });
        const delivered = orders.filter(o => o.status === 'Delivered');
        const active = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));

        const totalRevenue = delivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const earnings = delivered.length * 120; // ₹120 per delivery

        // Orders today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayDelivered = delivered.filter(o => new Date(o.createdAt) >= today).length;

        res.json({
            success: true,
            data: {
                rider,
                stats: {
                    totalOrders: orders.length,
                    deliveredOrders: delivered.length,
                    activeOrders: active.length,
                    totalRevenue,
                    totalEarnings: earnings,
                    todayDeliveries: todayDelivered,
                    todayEarnings: todayDelivered * 120,
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.checkInRider = async (req, res) => {
    try {
        const { orderId } = req.body;
        const rider = await Rider.findById(req.params.id);
        if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

        // Set status to Delivering
        rider.status = 'Delivering';
        await rider.save();

        // If orderId provided, update that order
        if (orderId) {
            await Order.findByIdAndUpdate(orderId, { status: 'Out for Delivery' });
        }

        res.json({ success: true, data: rider, message: 'Rider checked in — status set to Delivering' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.checkOutRider = async (req, res) => {
    try {
        const rider = await Rider.findById(req.params.id);
        if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

        rider.status = 'Available';
        rider.totalDeliveries = (rider.totalDeliveries || 0) + 1;
        await rider.save();

        res.json({ success: true, data: rider, message: 'Delivery completed — rider now Available' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
