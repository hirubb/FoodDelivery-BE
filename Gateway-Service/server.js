// api-gateway/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());

// Example base URLs for your microservices
const AUTH_SERVICE = 'http://localhost:5001'; // Authentication
const RESTAURANT_SERVICE = 'http://localhost:5002'; // Restaurant management
const ORDER_SERVICE = 'http://localhost:5003'; // Order management
const DELIVERY_SERVICE = 'http://localhost:5004'; // Delivery service
const PAYMENT_SERVICE = 'http://localhost:5005'; // Payment service

// Route requests to appropriate service
app.use('/api/auth', createProxyMiddleware({ target: AUTH_SERVICE, changeOrigin: true }));
app.use('/api/restaurants', createProxyMiddleware({ target: RESTAURANT_SERVICE, changeOrigin: true }));
app.use('/api/orders', createProxyMiddleware({ target: ORDER_SERVICE, changeOrigin: true }));
app.use('/api/delivery', createProxyMiddleware({ target: DELIVERY_SERVICE, changeOrigin: true }));
app.use('/api/payment', createProxyMiddleware({ target: PAYMENT_SERVICE, changeOrigin: true }));

// Default route
app.get('/', (req, res) => {
  res.send('API Gateway Running...');
});

// Start API Gateway
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running at http://localhost:${PORT}`);
});
