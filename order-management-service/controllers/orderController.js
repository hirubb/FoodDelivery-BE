const axios = require("axios");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { v4: uuidv4 } = require("uuid");

const RESTAURANT_BASE_URL = process.env.RESTAURANT_BASE_URL;

exports.placeOrder = async (req, res) => {
  // Get customer information and total amount directly from request body
  const customerId = req.userId;
  const {restaurantId, items, totalAmount,deliveryLocation } = req.body;

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
     
      // ✅ 6. Process location data
    let locationData = null;
    if (deliveryLocation) {
      console.log("✅ Delivery location provided:", deliveryLocation);
      locationData = {
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
        accuracy: deliveryLocation.accuracy,
        timestamp: deliveryLocation.timestamp
      };
      
      // Optional: You could use a geocoding service here to get the address from coordinates
      // For example: locationData.address = await getAddressFromCoordinates(locationData);
    } else {
      console.log("⚠️ No delivery location provided");
    }

    // ✅ 7. Save the order with generated orderId, total amount, and location
        const newOrder = new Order({
          orderId: uuidv4(),
          customerId,
          restaurantId,
          items,
          totalAmount,
          deliveryLocation: locationData,
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


    const response = await axios.post(`${RESTAURANT_BASE_URL}/sendOrderDetails`, {orders});
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
      order.status = "Pending";
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

// Update an order including location
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { items, totalAmount, deliveryLocation } = req.body;
  
  try {
    // Check if order exists
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: "Order not found" 
      });
    }
    
    // Check if order belongs to the authenticated user
    if (order.customerId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to update this order"
      });
    }
    
    // Check if order can be modified (only allow updates on Pending orders)
    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        error: "Cannot update an order that is already being processed"
      });
    }
    
    // Update the order
    if (items) order.items = items;
    if (totalAmount) order.totalAmount = totalAmount;
    if (deliveryLocation) order.deliveryLocation = deliveryLocation;
    
    await order.save();
    
    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update order",
      details: error.message
    });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if order exists
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }
    
    // Check if order belongs to the authenticated user
    if (order.customerId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to delete this order"
      });
    }
    
    // Check if order can be deleted (only allow deletion of Pending orders)
    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete an order that is already being processed"
      });
    }
    
    // Delete the order
    await Order.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete order",
      details: error.message
    });
  }
};

exports.getIncome = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { dateRange, groupBy } = req.body; // groupBy can be 'day' or 'month'

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID is required" });
    }

    // Build the match stage for aggregation
    const matchStage = {
      restaurantId: restaurantId,
      createdAt: {
        $gte: new Date(dateRange.start), // assuming start and end dates come from frontend
        $lte: new Date(dateRange.end)
      },
      paymentStatus: 'Paid' // Only count paid orders
    };

    // Define group format
    let groupStage;
    if (groupBy === 'month') {
      groupStage = {
        _id: { 
          year: { $year: "$createdAt" }, 
          month: { $month: "$createdAt" }
        },
        totalIncome: { $sum: "$totalAmount" }
      };
    } else {
      // default is grouping by day
      groupStage = {
        _id: { 
          year: { $year: "$createdAt" }, 
          month: { $month: "$createdAt" }, 
          day: { $dayOfMonth: "$createdAt" }
        },
        totalIncome: { $sum: "$totalAmount" }
      };
    }

    const incomeData = await Order.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } } // sort by time ascending
    ]);

    // Format the data nicely for frontend (x, y)
    const formattedData = incomeData.map(item => {
      const { year, month, day } = item._id;
      const dateString = groupBy === 'month' 
        ? `${year}-${String(month).padStart(2, '0')}`
        : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      return {
        date: dateString,
        income: item.totalIncome
      };
    });

    res.json({ success: true, data: formattedData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching Income" });
  }
};

exports.orderStatusUpdate = async (req, res) => {

  const { orderId } = req.params; // Get orderId from URL params
  const { newStatus } = req.body; 

  try {
    // Find the order by orderId
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update the order status
    order.status = newStatus;

    // Save the updated order
    await order.save();

    // Return the updated order data as the response
    return res.status(200).json({ message: 'Order status updated successfully', order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update order status', error: err.message });
  }




}