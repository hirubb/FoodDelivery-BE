// models/payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
    currency: {
      type: String,
      default: 'LKR',
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'canceled', 'chargedback'],
      default: 'pending',
    },
    paymentId: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    paymentTimestamp: {
      type: Date,
    },
    customerDetails: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      country: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    deliveryDetails: {
      address: String,
      city: String,
      country: String,
      postalCode: String,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;