const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerName: String,
  customerEmail: String,
  restaurantId: String,
  status: {
    type: String,
    enum: ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
    default: "Pending",
  },
  items: [
    {
      itemId: String,
      name: String,
      quantity: Number,
      price: Number,
    },
  ],
  totalPrice: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
