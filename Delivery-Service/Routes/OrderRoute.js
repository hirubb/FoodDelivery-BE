// routes/order.routes.js
const express = require('express');
const orderController = require('../Controllers/OrderController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// Get available orders
router.get('/available', orderController.getAvailableOrders);

// Get driver's orders
router.get('/', orderController.getDriverOrders);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Update order status
router.put('/:id/status', orderController.updateOrderStatus);

module.exports = router;
