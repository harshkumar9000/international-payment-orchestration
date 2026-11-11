/**
 * Vercel Serverless Function Entrypoint
 * Exports the Express application instance for Vercel's Node.js runtime.
 */
const { app } = require('../src/server');

module.exports = app;

