// controllers/paymentController.js
const Payment = require('../models/paymentModel');
const { generatePayHereHash, verifyPayHereNotification, getPaymentStatus } = require('../utils/paymentUtils');
const { geocodeAddress } = require('../utils/geocodingUtils');
const axios = require('axios');
require('dotenv').config();

// Initialize payment
exports.initializePayment = async (req, res) => {
  try {
    const {
      orderId,
      customerId,
      restaurantId,
      amount,
      items,
      customerDetails,
      deliveryDetails
    } = req.body;

    // Validate required fields
    if (!orderId || !customerId || !restaurantId || !amount || !items) {
      return res.status(400).json({ message: 'Missing required payment information' });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
      return res.status(400).json({ message: 'Payment for this order already exists' });
    }

    // Geocode customer address
    let customerCoordinates = null;
    if (customerDetails && customerDetails.address) {
      customerCoordinates = await geocodeAddress(
        customerDetails.address, 
        customerDetails.city, 
        customerDetails.country || 'Sri Lanka'
      );
    }

    // Enhanced customer details with coordinates
    const enhancedCustomerDetails = {
      ...customerDetails,
      coordinates: customerCoordinates || undefined
    };

    // Create new payment record
    const payment = new Payment({
      orderId,
      customerId,
      restaurantId,
      amount,
      items,
      customerDetails: enhancedCustomerDetails,
      deliveryDetails
    });

    await payment.save();

    // Generate hash for PayHere
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const currency = 'LKR'; // Default to LKR

    const hash = generatePayHereHash(
      merchantId,
      orderId,
      amount,
      currency,
      merchantSecret
    );

    // Construct payment data for frontend
    const paymentData = {
      sandbox: process.env.NODE_ENV !== 'production', // Use sandbox for non-production
      merchant_id: merchantId,
      return_url: process.env.PAYHERE_RETURN_URL,
      cancel_url: process.env.PAYHERE_CANCEL_URL,
      notify_url: process.env.PAYHERE_NOTIFY_URL,
      order_id: orderId,
      items: items.map(item => item.name).join(', ').substring(0, 255), // Combine item names with limit
      amount: amount.toFixed(2),
      currency,
      hash,
      first_name: customerDetails.firstName || '',
      last_name: customerDetails.lastName || '',
      email: customerDetails.email || '',
      phone: customerDetails.phone || '',
      address: customerDetails.address || '',
      city: customerDetails.city || '',
      country: customerDetails.country || 'Sri Lanka',
      delivery_address: deliveryDetails?.address || customerDetails.address || '',
      delivery_city: deliveryDetails?.city || customerDetails.city || '',
      delivery_country: deliveryDetails?.country || customerDetails.country || 'Sri Lanka',
      custom_1: customerId, // Store customer ID
      custom_2: restaurantId // Store restaurant ID
    };

    res.status(200).json({
      message: 'Payment initialized successfully',
      paymentData,
      customerCoordinates // Include coordinates in response
    });
    
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({ message: 'Server error during payment initialization' });
  }
};

// Handle payment notification from PayHere
exports.handlePaymentNotification = async (req, res) => {
  try {
    const notificationData = req.body;
    console.log('PayHere Notification:', notificationData);

    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      method,
      card_holder_name,
      card_no,
      card_expiry
    } = notificationData;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    // Verify the notification signature
    const isValid = verifyPayHereNotification(notificationData, merchantSecret);

    if (!isValid) {
      console.error('Invalid PayHere notification signature');
      return res.status(400).send('Invalid signature');
    }

    // Find the payment by order ID
    const payment = await Payment.findOne({ orderId: order_id });
    
    if (!payment) {
      console.error(`Payment not found for order ${order_id}`);
      return res.status(404).send('Payment not found');
    }

    // Update payment status and details
    payment.status = getPaymentStatus(status_code);
    payment.paymentId = payment_id;
    payment.paymentMethod = method || '';
    payment.paymentTimestamp = new Date();
    
    // Save card info if available (masked)
    if (card_holder_name) {
      payment.cardDetails = {
        holderName: card_holder_name,
        maskedNumber: card_no,
        expiry: card_expiry
      };
    }

    await payment.save();

    // Notify order service about payment status (if successful)
    if (status_code === '2') {
      try {
        await axios.post('http://localhost:5000/api/orders/payment-update', {
          orderId: order_id,
          status: 'paid',
          paymentId: payment_id
        });
        console.log(`Order service notified about successful payment for order ${order_id}`);
      } catch (err) {
        console.error('Error notifying order service:', err.message);
        // Continue processing despite notification error
      }
    }

    // Acknowledge the notification
    res.status(200).send('Notification received');
    
  } catch (error) {
    console.error('Error processing payment notification:', error);
    res.status(500).send('Server error');
  }
};

// Get payment status with customer coordinates
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paymentId: payment.paymentId,
      paymentMethod: payment.paymentMethod,
      paymentTimestamp: payment.paymentTimestamp,
      customerCoordinates: payment.customerDetails?.coordinates || null
    });
    
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ message: 'Server error while fetching payment status' });
  }
};

// Get all payments for a customer
exports.getCustomerPayments = async (req, res) => {
  try {
    const customerId = req.userId; // From auth middleware
    
    const payments = await Payment.find({ customerId })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      message: 'Customer payments retrieved successfully',
      payments
    });
    
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    res.status(500).json({ message: 'Server error while fetching customer payments' });
  }
};

// Get all payments for a restaurant
exports.getRestaurantPayments = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    const payments = await Payment.find({ restaurantId })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      message: 'Restaurant payments retrieved successfully',
      payments
    });
    
  } catch (error) {
    console.error('Error fetching restaurant payments:', error);
    res.status(500).json({ message: 'Server error while fetching restaurant payments' });
  }
};

exports.regenerateCoordinates = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.userId; // From auth middleware
    
    // Find payment by order ID and customer ID
    const payment = await Payment.findOne({ orderId, customerId });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found or unauthorized' });
    }
    
    // Check if we have address information
    if (!payment.customerDetails || !payment.customerDetails.address) {
      return res.status(400).json({ message: 'No address information available for geocoding' });
    }
    
    // Perform geocoding
    const coordinates = await geocodeAddress(
      payment.customerDetails.address,
      payment.customerDetails.city,
      payment.customerDetails.country || 'Sri Lanka',
      payment.customerDetails.postalCode
    );
    
    if (!coordinates) {
      return res.status(400).json({ message: 'Could not geocode the address' });
    }
    
    // Update customer coordinates
    payment.customerDetails = {
      ...payment.customerDetails,
      coordinates
    };
    
    await payment.save();
    
    res.status(200).json({
      message: 'Customer coordinates regenerated successfully',
      orderId,
      coordinates
    });
    
  } catch (error) {
    console.error('Error regenerating coordinates:', error);
    res.status(500).json({ message: 'Server error while regenerating coordinates' });
  }
};

