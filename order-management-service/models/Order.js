const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Customer'
  },
  restaurantId: String,
  items: [
    {
      menuItemId: String,
      quantity: Number,
    },
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered"],
    default: "Pending",
  },
  paymentStatus: {
    type: String,
    enum: ["Unpaid", "Paid"],
    default: "Unpaid",
  },
  orderId: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add validation middleware
orderSchema.pre('save', async function(next) {
  if (!mongoose.Types.ObjectId.isValid(this.customerId)) {
    throw new Error('Invalid customer ID format');
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);