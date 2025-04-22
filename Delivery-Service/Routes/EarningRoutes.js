// routes/earnings.routes.js
const express = require('express');
const earningsController = require('../Controllers/EarningController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// Get driver's earnings
router.get('/', earningsController.getEarnings);

// Get earnings summary
router.get('/summary', earningsController.getEarningsSummary);

module.exports = router;
