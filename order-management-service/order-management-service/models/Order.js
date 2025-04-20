const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerId: String,
  restaurantId: String,
  items: [
    {
      menuItemId: String,
      quantity: Number,
    },
  ],
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
});

module.exports = mongoose.model("Order", orderSchema);
