const axios = require("axios");
const Order = require("../models/Order");

const restaurantBaseURL = process.env.RESTAURANT_SERVICE_URL;

exports.placeOrder = async (req, res) => {
  try {
    const { customerId, restaurantId, items } = req.body;

    // Step 1: Validate restaurant exists
    const restaurantRes = await axios.get(`${restaurantBaseURL}/restaurants/${restaurantId}`);
    if (!restaurantRes.data) return res.status(404).send("Restaurant not found");

    // Step 2: Validate menu items
    const menuRes = await axios.get(`${restaurantBaseURL}/restaurants/${restaurantId}/menu`);
    const menu = menuRes.data;
    const invalidItems = items.filter(i => !menu.some(m => m._id === i.menuItemId));
    if (invalidItems.length > 0) return res.status(400).send("Invalid menu items");

    // Step 3: Save order
    const newOrder = new Order({ customerId, restaurantId, items });
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
