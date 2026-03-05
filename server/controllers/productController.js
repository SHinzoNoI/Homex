const Product = require('../models/Product');
const { createError } = require('../middleware/errorHandler');
const R = require('../utils/apiResponse');

exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 50, category, search, featured,
      sort = 'createdAt', order = 'desc', minPrice, maxPrice, brand,
    } = req.query;

    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const allowedSorts = ['price', 'stock', 'name', 'createdAt'];
    const sortObj = {};
    sortObj[allowedSorts.includes(sort) ? sort : 'createdAt'] = order === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(filter),
    ]);

    return R.paginated(res, products, { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return next(createError(404, 'Product not found'));
    return R.success(res, product);
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    return R.created(res, product, 'Product created successfully');
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return next(createError(404, 'Product not found'));
    return R.success(res, product, 'Product updated');
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(createError(404, 'Product not found'));
    return R.success(res, null, 'Product deleted');
  } catch (err) { next(err); }
};

exports.updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true });
    if (!product) return next(createError(404, 'Product not found'));
    return R.success(res, product, 'Stock updated');
  } catch (err) { next(err); }
};
