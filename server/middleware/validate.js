/**
 * Joi request validation middleware factory
 * Usage: router.post('/', validate(mySchema), controller)
 */
const validate = (schema, property = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
        abortEarly: false,       // collect all errors at once
        stripUnknown: true,      // remove unknown fields
        convert: true,           // coerce types (e.g., string → number)
    });

    if (error) {
        const details = error.details.map(d => d.message.replace(/['"]/g, '')).join(', ');
        return res.status(422).json({ success: false, message: `Validation failed: ${details}` });
    }

    req[property] = value; // replace with sanitized value
    next();
};

module.exports = validate;
