// controllers/paymentController.js
const crypto = require('crypto');
const axios = require('axios');
const Payment = require('../models/paymentModel');
const messageQueue = require('../utils/messageQueue');

// Initialize payment with PayHere
exports.initializePayment = async (req, res) => {
  try {
    const { orderId, customerId, amount, items, customerDetails } = req.body;
    
    // Validate required parameters
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    if (!customerDetails || !customerDetails.first_name || !customerDetails.email) {
      return res.status(400).json({ message: 'Customer details are incomplete' });
    }
    
    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ 
      orderId, 
      status: { $in: ['PENDING', 'COMPLETED'] }
    });
    
    if (existingPayment && existingPayment.status === 'COMPLETED') {
      return res.status(400).json({ 
        message: 'This order has already been paid for',
        paymentId: existingPayment._id
      });
    }
    
    // Use existing payment if pending, create new one if none exists
    const payment = existingPayment || new Payment({
      orderId,
      customerId,
      amount,
      status: 'PENDING'
    });
    
    if (!existingPayment) {
      await payment.save();
    }
    
    // Construct PayHere request data
    const paymentData = {
      merchant_id: process.env.PAYHERE_MERCHANT_ID,
      return_url: process.env.PAYHERE_RETURN_URL,
      cancel_url: process.env.PAYHERE_CANCEL_URL,
      notify_url: process.env.PAYHERE_NOTIFY_URL,
      order_id: payment._id.toString(),
      items: items || 'Food Order', // Default value if items not provided
      currency: 'LKR',
      amount: amount.toString(),
      first_name: customerDetails.first_name,
      last_name: customerDetails.last_name || '',
      email: customerDetails.email,
      phone: customerDetails.phone || '',
      address: customerDetails.address || 'N/A', // Optional
      city: customerDetails.city || 'N/A',       // Optional
      country: customerDetails.country || 'Sri Lanka' // Default
    };
    
    // Generate hash for PayHere (Production only - sandbox doesn't require this)
    if (process.env.NODE_ENV === 'production') {
      const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
      const hashedData = generatePayHereHash(paymentData, merchantSecret);
      paymentData.hash = hashedData;
    }
    
    // Return payment initialization data to frontend
    res.status(200).json({
      paymentId: payment._id,
      paymentData
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ message: 'Payment initialization failed', error: error.message });
  }
};

// PayHere callback notification handler
exports.paymentCallback = async (req, res) => {
  try {
    const paymentData = req.body;
    
    console.log('Received PayHere notification:', paymentData);
    
    // Always respond quickly to PayHere to acknowledge receipt
    // This prevents PayHere from retrying the notification
    res.status(200).send('Payment notification received');
    
    // Verify the authenticity of the notification (for production)
    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyPayHereNotification(paymentData);
      if (!isValid) {
        console.error('Invalid payment notification, possible security issue:', paymentData);
        return; // Already sent 200 response, but don't process this notification
      }
    }
    
    // Find and update the payment record
    const payment = await Payment.findById(paymentData.order_id);
    
    if (!payment) {
      console.error('Payment not found for order ID:', paymentData.order_id);
      return;
    }
    
    // Update payment status based on PayHere status code
    const paymentStatus = getPaymentStatus(paymentData.status_code);
    
    payment.status = paymentStatus;
    payment.paymentReference = paymentData.payment_id;
    payment.transactionDetails = paymentData;
    
    await payment.save();
    
    // If payment is completed successfully, update order status via Order service
    if (paymentStatus === 'COMPLETED') {
      try {
        const messageQueue = require('../utils/messageQueue');
        
        // Update order via direct API call
        await updateOrderStatus(payment.orderId, 'PAID');
        
        // Also publish to message queue for asynchronous processing
        await messageQueue.publishToQueue('payment_notifications', {
          orderId: payment.orderId,
          paymentId: payment._id,
          status: paymentStatus,
          amount: payment.amount
        });
        
        console.log(`Payment ${payment._id} completed successfully for order ${payment.orderId}`);
      } catch (orderError) {
        console.error('Failed to update order status:', orderError);
      }
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    // We've already sent a 200 response to PayHere, so just log the error
  }
};

// Get payment status by ID
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.status(200).json({
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Failed to get payment status', error: error.message });
  }
};

// Get all payments for a customer
exports.getCustomerPayments = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const payments = await Payment.find({ customerId })
      .sort({ createdAt: -1 });
    
    res.status(200).json(payments);
  } catch (error) {
    console.error('Get customer payments error:', error);
    res.status(500).json({ message: 'Failed to get customer payments', error: error.message });
  }
};

// Get all payments for an order
exports.getOrderPayments = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const payments = await Payment.find({ orderId })
      .sort({ createdAt: -1 });
    
    res.status(200).json(payments);
  } catch (error) {
    console.error('Get order payments error:', error);
    res.status(500).json({ message: 'Failed to get order payments', error: error.message });
  }
};

// Helper function to generate PayHere MD5 hash
function generatePayHereHash(data, merchantSecret) {
  const merchantId = data.merchant_id;
  const orderId = data.order_id;
  const amount = data.amount;
  const currency = data.currency;
  
  const hashString = merchantId + orderId + amount + currency + 
    crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  
  return crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
}

// Helper function to verify PayHere notification
function verifyPayHereNotification(data) {
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const merchantId = data.merchant_id;
  const orderId = data.order_id;
  const paymentId = data.payment_id;
  const amount = data.payhere_amount;
  const currency = data.payhere_currency;
  const statusCode = data.status_code;
  const md5sig = data.md5sig;
  
  const localHash = crypto.createHash('md5')
    .update(merchantId + orderId + amount + currency + statusCode + 
           crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase())
    .digest('hex').toUpperCase();
  
  return localHash === md5sig;
}

// Helper function to map PayHere status codes to internal status
function getPaymentStatus(statusCode) {
  const statusMap = {
    '2': 'COMPLETED', // 2: Success
    '0': 'PENDING',   // 0: Pending
    '-1': 'CANCELLED', // -1: Canceled
    '-2': 'FAILED',    // -2: Failed
    '-3': 'CHARGEDBACK' // -3: Chargedback
  };
  
  return statusMap[statusCode] || 'PENDING';
}

// Helper function to update order status via Order service
async function updateOrderStatus(orderId, status) {
  try {
    // Call Order service API to update order status
    // This is a simplified example - you'll need to implement actual service communication
    const response = await axios.patch(`${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}/status`, {
      status
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw error;
  }
}