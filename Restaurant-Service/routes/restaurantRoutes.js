const express = require("express");
const router = express.Router();
const { registerRestaurant,myRestaurants,getAllRestaurants,rateRestaurant,getTopRatedRestaurants,getRestaurantById } = require("../controllers/restaurantController");
const authenticate = require("../middleware/authMiddleware"); 
const upload = require("../middleware/upload");

// POST route for restaurant registration
router.post("/register", authenticate, upload.fields([{ name: 'logo' }, { name: 'banner_image' }]), registerRestaurant);
router.get("/my-restaurants",authenticate, myRestaurants)
router.get("/",getAllRestaurants)

router.post('/:restaurantId/rate', authenticate, rateRestaurant);
router.get('/top-rated', getTopRatedRestaurants);
router.get("/:restaurantId",getRestaurantById)

module.exports = router;
