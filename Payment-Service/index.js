const crypto = require('crypto');

// Input parameters
const merchant_id = "1230186";
const order_id = "ORD-123456";
const payhere_amount = "1500.00";
const payhere_currency = "LKR";
const status_code = "2";
const merchantSecret = "MjE3MjE3MTI2OTI0OTY2Nzk1ODMzNTM3NzYwNjAyMTQ1MTk0NTcwOQ==";

// Generate merchant secret hash
const merchantSecretHash = crypto.createHash('md5')
  .update(merchantSecret)
  .digest('hex')
  .toUpperCase();

// Generate final hash
const dataString = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${merchantSecretHash}`;
const md5sig = crypto.createHash('md5')
  .update(dataString)
  .digest('hex')
  .toUpperCase();

console.log("MD5 Signature:", md5sig);