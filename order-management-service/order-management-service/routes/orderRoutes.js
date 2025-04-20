const express = require("express");
const router = express.Router();
const { placeOrder } = require("../controllers/orderController.js");

// orderRoutes.js
router.post("/", placeOrder);

module.exports = router;
