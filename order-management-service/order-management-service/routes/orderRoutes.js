const express = require("express");
const router = express.Router();
const { placeOrder ,updateOrderStatus,getOrderStatus} = require("../controllers/orderController.js");

// orderRoutes.js
router.post("/", placeOrder);

// Route to update order status
router.patch("/:id/status", updateOrderStatus);

// Route to get order status
router.get("/:id/status", getOrderStatus);

module.exports = router;
