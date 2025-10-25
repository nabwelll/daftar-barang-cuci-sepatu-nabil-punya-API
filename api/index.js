// Entry untuk Vercel Serverless Function
const serverless = require('serverless-http');
const app = require('../src/app');

module.exports = serverless(app);