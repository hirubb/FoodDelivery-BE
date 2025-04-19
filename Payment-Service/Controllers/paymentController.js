const axios = require('axios');
const Payment = require('../models/paymentModel');
const crypto = require('crypto');

const initiatePayment = async (req, res) => {
  try {
    const { orderId, amount, customer } = req.body;

    const newPayment = await Payment.create({
      orderId,
      amount,
      customer,
    });

    const data = {
      merchant_id: process.env.PAYHERE_MERCHANT_ID,
      return_url: process.env.PAYHERE_RETURN_URL,
      cancel_url: process.env.PAYHERE_CANCEL_URL,
      notify_url: process.env.PAYHERE_NOTIFY_URL,
      order_id: orderId,
      items: "Food Order",
      amount,
      currency: "LKR",
      first_name: customer.name,
      last_name: "-",
      email: customer.email,
      phone: customer.phone,
      address: "N/A",
      city: "Colombo",
      country: "Sri Lanka",
    };

    res.status(200).json({
      status: "success",
      message: "Redirect user to PayHere",
      paymentURL: "https://sandbox.payhere.lk/pay/checkout",
      payload: data
    });

  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

const handleCallback = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      status_code,
      md5sig
    } = req.body;

    const localPayment = await Payment.findOne({ orderId: order_id });

    if (!localPayment) {
      return res.status(404).send('Payment record not found.');
    }

    // Generate server-side signature to verify
    const generatedSig = crypto
      .createHash('md5')
      .update(
        `${merchant_id}${order_id}${localPayment.amount}${status_code}${crypto.createHash('md5').update(process.env.PAYHERE_SECRET).digest("hex")}`
      )
      .digest("hex")
      .toUpperCase();

    if (generatedSig !== md5sig) {
      return res.status(400).send('Invalid signature.');
    }

    localPayment.status = status_code === '2' ? 'paid' : 'failed';
    localPayment.payhereData = req.body;
    await localPayment.save();

    return res.status(200).send('Payment updated.');
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  initiatePayment,
  handleCallback
};
