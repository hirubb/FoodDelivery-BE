const express = require("express");
const router = express.Router();
const { registerRestaurant,myRestaurants } = require("../controllers/restaurantController");
const authenticate = require("../middleware/authMiddleware"); 

// POST route for restaurant registration
router.post("/register",authenticate,registerRestaurant);
router.get("/my-restaurants",authenticate, myRestaurants)

module.exports = router;
