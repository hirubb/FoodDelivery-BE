const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.post("/", orderController.placeOrder);
router.put("/:id", orderController.modifyOrder);
router.get("/:id", orderController.trackOrder);
router.patch("/:id/status", orderController.updateStatus);

module.exports = router;
