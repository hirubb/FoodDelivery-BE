const express = require("express");
const router = express.Router();
const { registerRestaurantOwner } = require("../controllers/restaurantOwnerController");
const authenticate = require("../middleware/authMiddleware");  // Import the middleware


router.post("/register", registerRestaurantOwner);


module.exports = router;
