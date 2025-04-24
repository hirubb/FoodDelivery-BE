const axios = require("axios");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { v4: uuidv4 } = require("uuid");

const RESTAURANT_BASE_URL = process.env.RESTAURANT_BASE_URL;

exports.placeOrder = async (req, res) => {
  // Get customer information and total amount directly from request body
  const customerId = req.userId;
  const {restaurantId, items, totalAmount } = req.body;

  try {
    console.log("➡️ Incoming Order Request:", req.body);
    console.log("✅ Using authenticated customerId:", customerId);

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required to place an order"
      });
    }


    // ✅ 2. Check if restaurant exists
    try {
      const restaurantRes = await axios.get(`${RESTAURANT_BASE_URL}/${restaurantId}`);
      if (!restaurantRes.data) {
        return res.status(404).json({ 
          success: false,
          error: "Restaurant not found" 
        });
      }
      
      console.log("✅ Restaurant validated:", restaurantId);
      
    } catch (error) {
      console.error("Restaurant validation error:", error.message);
      return res.status(404).json({
        success: false,
        error: "Restaurant validation failed. Restaurant may not exist."
      });
    }

    // ✅ 3. Fetch menu
    let menu;
    try {
      const menuRes = await axios.get(`${RESTAURANT_BASE_URL}/${restaurantId}/menu`);
      menu = menuRes.data;
      
      if (!menuRes.data || !Array.isArray(menuRes.data)) {
        console.log("Invalid menu response:", menuRes.data);
        return res.status(404).json({
          success: false,
          error: "Restaurant menu not found or invalid format"
        });
      }

      if (menu.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Restaurant menu is empty"
        });
      }
      
      console.log("✅ Menu fetched successfully:", menu.length, "items");
      
    } catch (error) {
      console.error("Menu fetch error:", error.message);
      console.error("Full error:", error.response?.data || error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch restaurant menu",
        details: error.response?.data || error.message
      });
    }

    // ✅ 4. Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Order must contain at least one item"
      });
    }
    
    // Find all menu items to validate against
    const allMenuItems = menu.flatMap(category => category.menu_items || []);
    
    const invalidItems = items.filter(orderItem =>
      !allMenuItems.some(menuItem => menuItem._id === orderItem.menuItemId)
    );

    if (invalidItems.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid menu items", 
        invalidItems 
      });
    }
    
    console.log("✅ All menu items validated");

    // ✅ 5. Validate total amount
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid total amount is required"
      });
    }

    // ✅ 6. Save the order with generated orderId and total amount
    const newOrder = new Order({
      orderId: uuidv4(),
      customerId,
      restaurantId,
      items,
      totalAmount,
      status: "Pending",
      paymentStatus: "Unpaid"
    });

    await newOrder.save();

    console.log("✅ Order saved successfully:", newOrder.orderId);
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder
    });

  } catch (error) {
    console.error("🔥 Error during order creation:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to create order", 
      details: error.message 
    });
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

// Get customer orders
exports.getCustomerOrders = async (req, res) => {
  const { customerId } = req.params;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID format"
      });
    }
    
    const orders = await Order.find({ customerId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders"
    });
  }
};