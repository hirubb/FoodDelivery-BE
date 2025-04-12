const Order = require("../models/Order");
const axios = require("axios");
const { NOTIFICATION_SERVICE_URL } = require("../config");

// Place an order
exports.placeOrder = async (req, res) => {
  try {
    const { customerName, customerEmail, restaurantId, items } = req.body;
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newOrder = await Order.create({
      customerName,
      customerEmail,
      restaurantId,
      items,
      totalPrice,
    });

    // Notify customer via Notification Service
    await axios.post(`${NOTIFICATION_SERVICE_URL}/notify`, {
      to: customerEmail,
      subject: "Order Confirmation",
      text: `Hi ${customerName}, your order has been placed successfully! Order ID: ${newOrder._id}`,
    });

    res.status(201).json(newOrder);
  } catch (err) {
    console.error("Order placement error:", err.message);
    res.status(500).json({ error: err.message });
  }
  
};

// Modify order
exports.modifyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order || order.status !== "Pending") {
      return res.status(400).json({ message: "Cannot modify this order" });
    }

    Object.assign(order, req.body);
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Track order
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ status: order.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update status (used by delivery personnel or restaurant)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
