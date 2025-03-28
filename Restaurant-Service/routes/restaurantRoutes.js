const express = require("express");
const router = express.Router();
const { registerRestaurant } = require("../controllers/restaurantController");

// POST route for restaurant registration
router.post("/register", registerRestaurant);

module.exports = router;
