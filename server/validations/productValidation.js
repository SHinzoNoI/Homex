const Joi = require('joi');

const createProductSchema = Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional().allow(''),
    price: Joi.number().positive().required(),
    stock: Joi.number().integer().min(0).required(),
    category: Joi.string()
        .valid('Cement', 'Steel', 'Bricks', 'Sand', 'Timber', 'Plumbing', 'Electrical', 'Paint', 'Tools', 'Safety', 'Other')
        .required(),
    unit: Joi.string().max(20).default('unit'),
    brand: Joi.string().max(100).optional().allow(''),
    image: Joi.string().uri().optional().allow(''),
    featured: Joi.boolean().default(false),
});

const updateProductSchema = createProductSchema.fork(
    ['name', 'price', 'stock', 'category'],
    (field) => field.optional()
);

module.exports = { createProductSchema, updateProductSchema };
