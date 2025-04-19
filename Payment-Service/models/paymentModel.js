const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer: {
    name: String,
    email: String,
    phone: String,
  },
  amount: Number,
  status: { type: String, default: 'pending' }, // pending, paid, failed
  payhereData: Object
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
