const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/authMiddleware'); // Use the unified middleware

// Initialize a new payment
router.post('/initialize', auth, paymentController.initializePayment);

// PayHere callback notification endpoint - no auth required as it's called by PayHere
router.post('/callback', paymentController.paymentCallback);

// Get payment status by ID
router.get('/status/:paymentId', auth, paymentController.getPaymentStatus);

// Get all payments for a customer
router.get('/customer/:customerId', auth, paymentController.getCustomerPayments);

// Get all payments for an order
router.get('/order/:orderId', auth, paymentController.getOrderPayments);

module.exports = router;