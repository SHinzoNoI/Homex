// Vercel Serverless Function entry point
// Vercel auto-discovers this file and serves it at /api
// All /api/* requests are rewritten here via vercel.json
// Express handles routing internally (req.url stays as original path)
module.exports = require('../server/index');
