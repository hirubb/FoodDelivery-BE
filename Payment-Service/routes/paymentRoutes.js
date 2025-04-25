
const express = require('express');
const router = express.Router();
const paymentController = require('../Controllers/paymentController');
const authenticateCustomer = require('../middleware/authenticateCustomer');
const authenticateRestaurant = require('../middleware/authenticateRestaurant');

// Initialize payment (requires customer authentication)
router.post('/initialize', authenticateCustomer, paymentController.initializePayment);

// Payment notification from PayHere (no authentication - public webhook)
router.post('/callback', paymentController.handlePaymentNotification);

// Get payment status by order ID (can be accessed by customer or restaurant)
router.get('/status/:orderId', paymentController.getPaymentStatus);

// Manually update payment status (requires authentication)
router.put('/status/:orderId', authenticateCustomer, paymentController.updatePaymentStatus);

// Get all payments for authenticated customer
router.get('/customer', authenticateCustomer, paymentController.getCustomerPayments);

// Get all payments for restaurant (requires restaurant authentication)
router.get('/restaurant/:restaurantId', authenticateRestaurant, paymentController.getRestaurantPayments);

// Update customer coordinates for an order
router.post('/customer/order/:orderId/regenerate-coordinates', authenticateCustomer, paymentController.regenerateCoordinates);

// Manual sync endpoint to force update order status from payment
router.post('/sync/:orderId', authenticateCustomer, paymentController.syncPaymentWithOrder);

module.exports = router;