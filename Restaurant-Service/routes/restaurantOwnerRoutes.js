const express = require("express");
const router = express.Router();
const { registerRestaurantOwner, profile } = require("../controllers/restaurantOwnerController");
const authenticate = require("../middleware/authMiddleware");  // Import the middleware


router.post("/register", registerRestaurantOwner);
router.get("/my-details",authenticate, profile);


module.exports = router;
