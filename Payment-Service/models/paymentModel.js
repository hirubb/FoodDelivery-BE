// models/paymentModel.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    orderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      ref: 'Order'
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Customer'
    },
    amount: { 
      type: Number, 
      required: true 
    },
    currency: { 
      type: String, 
      default: 'LKR' 
    },
    status: { 
      type: String, 
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'PENDING' 
    },
    paymentMethod: { 
      type: String, 
      default: 'PayHere' 
    },
    paymentReference: { 
      type: String 
    },
    transactionDetails: { 
      type: Object 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);