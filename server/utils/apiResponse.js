/**
 * Standardized API response helpers
 */

const success = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({ success: true, message, data });
};

const created = (res, data, message = 'Created successfully') => {
    return success(res, data, message, 201);
};

const paginated = (res, data, pagination) => {
    return res.status(200).json({ success: true, data, pagination });
};

const error = (res, message = 'Something went wrong', statusCode = 500) => {
    return res.status(statusCode).json({ success: false, message });
};

const notFound = (res, entity = 'Resource') => {
    return error(res, `${entity} not found`, 404);
};

const unauthorized = (res, message = 'Authentication required') => {
    return error(res, message, 401);
};

const forbidden = (res, message = 'Access denied') => {
    return error(res, message, 403);
};

const badRequest = (res, message) => {
    return error(res, message, 400);
};

module.exports = { success, created, paginated, error, notFound, unauthorized, forbidden, badRequest };
