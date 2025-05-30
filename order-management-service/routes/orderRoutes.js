const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/customerAuth.js");

const {
  placeOrder,
  updateOrderStatus,
  getOrderStatus,
  getCustomerOrders,
  getOrderById,
  updatePaymentStatus,
  GetAllOrders,
  GetOrderIdForDeliveryRider,
  updateOrder,   // Add the new controller functions
  deleteOrder,
  getIncome,
  sendOrderToRestaurant,
  orderStatusUpdate
} = require("../controllers/orderController.js");

// No middleware needed - orders can be placed without authentication
router.post("/", authenticate, placeOrder);

// Route to update order status
router.patch("/:id/status", updateOrderStatus);  // Gayashan also uses this route to update the order status in the Delivery Person app

// Route to get order status
router.get("/:id/status", getOrderStatus);

// Route to get all orders for a customer
router.get("/customer/:customerId", getCustomerOrders);

// Add new route to get complete order data by ID
router.get("/:id", authenticate, getOrderById);

// Add new route for payment status updates (no auth required for PayHere callbacks)
router.post("/payment-update", updatePaymentStatus);

// Add new routes for updating orders
router.put("/:id", authenticate, updateOrder);

// Add new routes for deleting orders
router.delete("/:id", authenticate, deleteOrder);

router.post("/getIncome/:restaurantId", getIncome);

router.get("/restaurantOrders/:restaurantId", sendOrderToRestaurant);
router.put("/status/update/:orderId", orderStatusUpdate)


router.get("/DeliveryPerson/GetAllOrders", GetAllOrders); // Get all orders for a Delivery Person (Gayashan)


router.get("/DeliveryPerson/GetOrderById/:id", GetOrderIdForDeliveryRider);  // For the Delivery Person Map (Gayashan)

module.exports = router;