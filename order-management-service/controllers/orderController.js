const axios = require("axios");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { v4: uuidv4 } = require("uuid");

const RESTAURANT_BASE_URL = process.env.RESTAURANT_BASE_URL;

exports.placeOrder = async (req, res) => {
  // Get customer information and total amount directly from request body
  const customerId = req.userId;
  const { restaurantId, items, totalAmount } = req.body;

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

//get all orders by restaurant id
exports.getOrdersByRestaurant = async (req, res) => {

  try {
    const { restaurantId } = req.params;
    const orders = await Order.find({ restaurantId: restaurantId });
    if (!orders) return res.status(404).json({ error: "Order not found for the restaurant" });
    res.json({ status: orders });

  } catch (err) {
    res.status(500).json({ error: "Error fetching Orders" });
  }

}

exports.sendOrderToRestaurant = async (req, res) => {

  try {

    const { restaurantId } = req.params;

    const orders = await Order.find({ restaurantId: restaurantId });

    if (!orders) return res.status(404).json({ error: "Order not found for the restaurant" });


    const response = await axios.post(`${RESTAURANT_BASE_URL}/sendOrderDetails`, { orders });
    res.json({ status: response.data });

  } catch (err) {
    res.status(500).json({ error: "Error fetching Orders" });
  }


}

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

// Add this function to your orderController.js file

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID is a valid MongoDB ObjectId or UUID
    let order;
    if (mongoose.Types.ObjectId.isValid(id)) {
      // If it's a MongoDB ObjectId
      order = await Order.findById(id);
    } else {
      // If it's likely a UUID (orderId field)
      order = await Order.findOne({ orderId: id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    // Add item details to the order
    // In a real app, you might need to fetch this from restaurants service
    try {
      const menuRes = await axios.get(`${RESTAURANT_BASE_URL}/${order.restaurantId}/menu`);
      const menu = menuRes.data;
      const allMenuItems = menu.flatMap(category => category.menu_items || []);

      // Enhance order items with name and price from menu
      const enhancedItems = order.items.map(item => {
        const menuItem = allMenuItems.find(mi => mi._id === item.menuItemId);
        return {
          ...item.toObject(),
          name: menuItem ? menuItem.name : "Unknown Item",
          price: menuItem ? menuItem.price : 0
        };
      });

      // Create a new object that includes the complete order plus enhanced items
      const completeOrder = {
        ...order.toObject(),
        items: enhancedItems
      };

      return res.status(200).json({
        success: true,
        order: completeOrder
      });

    } catch (error) {
      // If we can't fetch menu items, return order without enhanced data
      console.error("Error fetching menu items:", error.message);
      return res.status(200).json({
        success: true,
        order,
        warning: "Could not retrieve full menu item details"
      });
    }

  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch order details"
    });
  }
};

// In orderController.js - Enhanced updatePaymentStatus function

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId, paymentStatus, paymentId } = req.body;

    console.log(`Updating order ${orderId} with payment status: ${paymentStatus}`);

    if (!orderId || !paymentStatus) {
      return res.status(400).json({
        success: false,
        error: "Order ID and payment status are required"
      });
    }

    // Find the order using orderId field (UUID)
    const order = await Order.findOne({ orderId: orderId });

    if (!order) {
      console.error(`Order not found with orderId: ${orderId}`);
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    // Update the order payment status
    const previousPaymentStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;

    // If payment is successful, update the order status to Confirmed
    if (paymentStatus === 'Paid') {
      order.status = "Confirmed";
      // Add timestamp for when payment was confirmed
      order.paymentConfirmedAt = new Date();
      console.log(`Order ${orderId} status updated to Confirmed`);
    }

    // Add payment ID reference if provided
    if (paymentId) {
      order.paymentId = paymentId;
    }

    await order.save();

    console.log(`Order ${orderId} payment status updated from ${previousPaymentStatus} to ${paymentStatus}`);

    // Return detailed response for debugging
    res.status(200).json({
      success: true,
      message: "Order payment status updated successfully",
      order: {
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        previousPaymentStatus
      }
    });

  } catch (error) {
    console.error("Error updating order payment status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update order payment status",
      details: error.message
    });
  }
};



// Get all orders for Delivery Person - Gayashan
exports.GetAllOrders = async (req, res) => {
  try {


    const orders = await Order.find()
    if (!orders) return res.status(404).json({ error: "No orders found" });
    res.json({ status: orders });
  } catch (err) {
    res.status(500).json({ error: "Error fetching orders" });
  }
};

// Get order by ID for Delivery Person - Gayashan
exports.GetOrderIdForDeliveryRider = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ status: order });
  } catch (err) {
    res.status(500).json({ error: "Error fetching order" });
  }
};