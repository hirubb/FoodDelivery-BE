const express = require("express");
const router = express.Router();
const { registerRestaurant,myRestaurants,getAllRestaurants } = require("../controllers/restaurantController");
const authenticate = require("../middleware/authMiddleware"); 
const upload = require("../middleware/upload");

// POST route for restaurant registration
router.post("/register", authenticate, upload.fields([{ name: 'logo' }, { name: 'banner_image' }]), registerRestaurant);
router.get("/my-restaurants",authenticate, myRestaurants)
router.get("/",getAllRestaurants)

module.exports = router;
