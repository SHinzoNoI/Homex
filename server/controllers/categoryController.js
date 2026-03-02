const Category = require('../models/Category');

// GET all categories (public)
exports.getCategories = async (req, res, next) => {
    try {
        const filter = req.user?.role === 'admin' ? {} : { isActive: true };
        const cats = await Category.find(filter).sort({ name: 1 });
        res.json({ success: true, data: cats });
    } catch (err) { next(err); }
};

// POST create category (admin)
exports.createCategory = async (req, res, next) => {
    try {
        const { name, description, icon } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
        const cat = await Category.create({ name, description, icon });
        res.status(201).json({ success: true, data: cat });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ success: false, message: 'Category already exists' });
        next(err);
    }
};

// PUT update category (admin)
exports.updateCategory = async (req, res, next) => {
    try {
        const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
        res.json({ success: true, data: cat });
    } catch (err) { next(err); }
};

// DELETE category (admin)
exports.deleteCategory = async (req, res, next) => {
    try {
        const cat = await Category.findByIdAndDelete(req.params.id);
        if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
        res.json({ success: true, message: 'Category deleted' });
    } catch (err) { next(err); }
};
