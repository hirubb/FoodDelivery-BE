const axios = require("axios");
const Order = require("../models/Order");
const { v4: uuidv4 } = require("uuid"); // Destructure v4 as uuidv4

const RESTAURANT_BASE_URL = process.env.RESTAURANT_BASE_URL;
console.log("🔗 RESTAURANT_BASE_URL =", RESTAURANT_BASE_URL);

exports.placeOrder = async (req, res) => {
  const { customerId, restaurantId, items } = req.body;

  try {
    console.log("➡️ Incoming Order Request:", req.body);

    // ✅ 1. Check if restaurant exists
    const restaurantRes = await axios.get(`${RESTAURANT_BASE_URL}/${restaurantId}`);
    if (!restaurantRes.data) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // ✅ 2. Fetch menu
    const menuRes = await axios.get(`http://localhost:3000/api/menu/${restaurantId}`);
    const menu = menuRes.data;

    // ✅ 3. Validate items
    const invalidItems = items.filter(orderItem =>
      !menu.some(menuItem => menuItem._id === orderItem.menuItemId)
    );

    if (invalidItems.length > 0) {
      return res.status(400).json({ error: "Invalid menu items", invalidItems });
    }

    // ✅ 4. Save the order with generated orderId
    const newOrder = new Order({
      orderId: uuidv4(),
      customerId,
      restaurantId,
      items
    });

    await newOrder.save();

    console.log("✅ Order saved:", newOrder);
    res.status(201).json(newOrder);

  } catch (error) {
    console.error("🔥 Error during order creation:", error);
    res.status(500).json({ error: "Failed to create order", details: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

exports.getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ status: order.status });
  } catch (err) {
    res.status(500).json({ error: "Error fetching status" });
  }
};
