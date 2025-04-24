const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/customerAuth.js");

const { 
  placeOrder, 
  updateOrderStatus, 
  getOrderStatus, 
  getCustomerOrders 
} = require("../controllers/orderController.js");

// No middleware needed - orders can be placed without authentication
router.post("/", authenticate, placeOrder);

// Route to update order status
router.patch("/:id/status", updateOrderStatus);

// Route to get order status
router.get("/:id/status", getOrderStatus);

// Route to get all orders for a customer
router.get("/customer/:customerId", getCustomerOrders);

module.exports = router;