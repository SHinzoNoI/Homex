const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid product ID format');

// Schema for creating an order
const createOrderSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            product: objectId.required(),
            name: Joi.string().required(),
            price: Joi.number().positive().required(),
            quantity: Joi.number().integer().min(1).max(1000).required(),
            image: Joi.string().uri().optional().allow(''),
        })
    ).min(1).required().messages({
        'array.min': 'Cart must have at least one item',
    }),
    customerName: Joi.string().min(2).max(100).default('Contractor'),
    customerPhone: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).optional().allow('').messages({
        'string.pattern.base': 'Invalid phone number format',
    }),
    deliveryAddress: Joi.string().min(5).max(500).default('Site Location, Mumbai'),
    notes: Joi.string().max(500).optional().allow(''),
});

// Schema for updating order status
const updateStatusSchema = Joi.object({
    status: Joi.string()
        .valid('Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled')
        .required(),
    riderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
});

// Schema for cancelling an order
const cancelOrderSchema = Joi.object({
    reason: Joi.string().max(300).optional().allow(''),
});

module.exports = { createOrderSchema, updateStatusSchema, cancelOrderSchema };
