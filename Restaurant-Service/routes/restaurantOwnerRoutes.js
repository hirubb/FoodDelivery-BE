const express = require("express");
const router = express.Router();
const { registerRestaurantOwner } = require("../controllers/restaurantOwnerController");
const authenticate = require("../middleware/authMiddleware");  // Import the middleware

// Public route for registration (no authentication required)
router.post("/register", registerRestaurantOwner);


module.exports = router;
