// utils/paymentUtils.js
const crypto = require('crypto');

/**
 * Generate PayHere hash for payment initialization
 * @param {Object} params - Payment parameters
 * @returns {String} - Uppercase MD5 hash
 */
const generatePayHereHash = (merchantId, orderId, amount, currency, merchantSecret) => {
  // Format amount to have 2 decimal places
  const formattedAmount = Number(amount).toFixed(2);
  
  // Generate merchant secret hash
  const merchantSecretHash = crypto.createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();
  
  // Generate final hash
  const dataString = `${merchantId}${orderId}${formattedAmount}${currency}${merchantSecretHash}`;
  const hash = crypto.createHash('md5')
    .update(dataString)
    .digest('hex')
    .toUpperCase();
  
  return hash;
};

/**
 * Verify PayHere notification hash
 * @param {Object} params - Notification parameters
 * @returns {Boolean} - If hash verification passed
 */
const verifyPayHereNotification = (params, merchantSecret) => {
  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig
  } = params;

  // Generate merchant secret hash
  const merchantSecretHash = crypto.createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();
  
  // Generate local hash to verify
  const dataString = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${merchantSecretHash}`;
  const localHash = crypto.createHash('md5')
    .update(dataString)
    .digest('hex')
    .toUpperCase();

    console.log("Expected MD5 Signature:", localHash);
    console.log("Received MD5 Signature:", md5sig);
  
  return localHash === md5sig;
};

/**
 * Get payment status based on PayHere status code
 * @param {String} statusCode - PayHere status code
 * @returns {String} - Normalized status
 */
const getPaymentStatus = (statusCode) => {
  const statusMap = {
    '2': 'success',
    '0': 'pending',
    '-1': 'canceled',
    '-2': 'failed',
    '-3': 'chargedback'
  };
  
  return statusMap[statusCode] || 'unknown';
};

module.exports = {
  generatePayHereHash,
  verifyPayHereNotification,
  getPaymentStatus
};