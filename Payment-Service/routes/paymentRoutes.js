const express = require('express');
const router = express.Router();
const { initiatePayment, handleCallback } = require('../Controllers/paymentController');

router.post('/initiate', initiatePayment);
router.post('/callback', handleCallback);

module.exports = router;
