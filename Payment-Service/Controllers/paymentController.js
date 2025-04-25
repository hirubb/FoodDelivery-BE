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
// In paymentController.js - Updated handlePaymentNotification function

exports.handlePaymentNotification = async (req, res) => {
  try {
    const notificationData = req.body;
    console.log('PayHere Notification Received:', JSON.stringify(notificationData));

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

    // 1. Validate incoming data
    if (!order_id || !status_code) {
      console.error('Missing required fields in PayHere notification');
      return res.status(400).send('Missing required fields');
    }

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    // 2. Verify the notification signature
    const isValid = verifyPayHereNotification(notificationData, merchantSecret);

    if (!isValid) {
      console.error('Invalid PayHere notification signature');
      return res.status(400).send('Invalid signature');
    }

    // 3. Find the payment by order ID
    const payment = await Payment.findOne({ orderId: order_id });
    
    if (!payment) {
      console.error(`Payment not found for order ${order_id}`);
      return res.status(404).send('Payment not found');
    }

    // 4. Update payment status based on PayHere status code
    const paymentStatus = getPaymentStatus(status_code);
    payment.status = paymentStatus;
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
    console.log(`Payment status updated to ${paymentStatus} for order ${order_id}`);

    // 5. If payment is successful (status_code 2), update the order status
    if (status_code === '2') {
      try {
        // Construct the full order service URL
        const orderServiceUrl = `${process.env.VITE_Order_URL || 'http://localhost:5001'}/orders/payment-update`;
        console.log(`Notifying order service at ${orderServiceUrl} for order ${order_id}`);
        
        // Send a more detailed payload
        const orderUpdateResponse = await axios.post(orderServiceUrl, {
          orderId: order_id,
          paymentStatus: 'Paid',
          paymentId: payment_id
        }, {
          // Add timeout to prevent hanging
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Order service update successful:', orderUpdateResponse.data);
      } catch (err) {
        console.error('Error updating order status:', err.message);
        console.error('Error details:', err.response?.data || 'No response data');
        
        // Even with error, we acknowledge the notification to PayHere
        // We'll implement a retry mechanism separately
        
        // Create a retry record or queue the update for later processing
        console.log('Scheduling retry for order status update...');
        // This could be implemented with a queue system or simple retry log
      }
    }

    // 6. Acknowledge the notification
    res.status(200).send('Notification received and processed');
    
  } catch (error) {
    console.error('Error processing payment notification:', error);
    res.status(500).send('Server error during notification processing');
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

// Manually update payment status (for testing or recovery)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    payment.status = status;
    if (paymentId) payment.paymentId = paymentId;
    
    await payment.save();
    
    // If status is success, also update the order
    if (status === 'success') {
      try {
        const orderServiceUrl = `${process.env.VITE_Order_URL || 'http://localhost:5001'}/orders/payment-update`;
        
        await axios.post(orderServiceUrl, {
          orderId,
          paymentStatus: 'Paid',
          paymentId: paymentId || payment.paymentId
        });
        
        console.log(`Order ${orderId} manually updated with payment status: Paid`);
      } catch (err) {
        console.error('Error updating order status:', err.message);
        return res.status(200).json({ 
          message: 'Payment updated but order status update failed',
          payment
        });
      }
    }
    
    res.status(200).json({
      message: 'Payment status updated successfully',
      payment
    });
    
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error while updating payment status' });
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

// Add this to paymentController.js

// Helper function to retry failed order updates
const retryOrderStatusUpdate = async (orderId, paymentStatus, paymentId, attempts = 0) => {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds
  
  if (attempts >= maxRetries) {
    console.error(`Max retries reached for order ${orderId}. Manual intervention needed.`);
    return;
  }
  
  try {
    const orderServiceUrl = `${process.env.VITE_Order_URL || 'http://localhost:5001'}/orders/payment-update`;
    
    console.log(`Retry attempt ${attempts + 1} for order ${orderId}`);
    
    const response = await axios.post(orderServiceUrl, {
      orderId,
      paymentStatus,
      paymentId
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Retry successful for order ${orderId}:`, response.data);
  } catch (error) {
    console.error(`Retry failed for order ${orderId}:`, error.message);
    
    // Schedule another retry with exponential backoff
    setTimeout(() => {
      retryOrderStatusUpdate(orderId, paymentStatus, paymentId, attempts + 1);
    }, retryDelay * Math.pow(2, attempts));
  }
};

// Update handlePaymentNotification to use this retry mechanism
// In the catch block of the order update section:

// Replace the catch block with:
/*
catch (err) {
  console.error('Error updating order status:', err.message);
  console.error('Error details:', err.response?.data || 'No response data');
  
  // Schedule a retry
  setTimeout(() => {
    retryOrderStatusUpdate(order_id, 'Paid', payment_id);
  }, 3000); // First retry after 3 seconds
}
*/

// Add this to paymentController.js

// Manual sync endpoint to force update order status
exports.syncPaymentWithOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Only sync successfully completed payments
    if (payment.status !== 'success') {
      return res.status(400).json({ 
        message: 'Cannot sync payment - status is not success',
        status: payment.status
      });
    }
    
    // Try to update the order
    try {
      const orderServiceUrl = `${process.env.VITE_Order_URL || 'http://localhost:5001'}/orders/payment-update`;
      
      const response = await axios.post(orderServiceUrl, {
        orderId,
        paymentStatus: 'Paid',
        paymentId: payment.paymentId
      });
      
      return res.status(200).json({
        message: 'Payment synchronized with order successfully',
        orderUpdate: response.data
      });
    } catch (error) {
      console.error('Error during manual sync:', error.message);
      return res.status(500).json({
        message: 'Failed to synchronize with order service',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error in sync handler:', error);
    return res.status(500).json({ message: 'Server error during sync operation' });
  }
};