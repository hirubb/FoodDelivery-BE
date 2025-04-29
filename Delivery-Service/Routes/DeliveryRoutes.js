// routes/order.routes.js
const express = require('express');
const orderController = require('../Controllers/OrderController');
const auth = require('../middleware/auth');

const router = express.Router();



// Get Delivery  by ID
router.get('/getDeliveryById', auth, orderController.getDeliveryById);

router.put('/updateDeliveryStatus', auth, orderController.updateDeliveryStatus);

router.get('/getAllDeliveriesForDriver', auth, orderController.getAllDeliveriesForDriver);

module.exports = router;
