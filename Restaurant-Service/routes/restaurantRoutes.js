const express = require("express");
const router = express.Router();
const { registerRestaurant } = require("../controllers/restaurantController");
const authenticate = require("../middleware/authMiddleware"); 

// POST route for restaurant registration
router.post("/register",authenticate,registerRestaurant);

module.exports = router;
