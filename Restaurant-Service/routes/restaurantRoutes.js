const express = require("express");
const router = express.Router();
const { registerRestaurant,myRestaurants,getAllRestaurants,rateRestaurant,getTopRatedRestaurants,getRestaurantById,updateStatus,edtRestaurant,getRestaurantOrders,getOrderDetails } = require("../controllers/restaurantController");
const authenticate = require("../middleware/authMiddleware"); 
const upload = require("../middleware/upload");
const menuController = require("../controllers/menuController");

// POST route for restaurant registration
router.post("/register", authenticate, upload.fields([{ name: 'logo' }, { name: 'banner_image' }]), registerRestaurant);
router.get("/my-restaurants",authenticate, myRestaurants)
router.get("/",getAllRestaurants)

router.get('/top-rated', getTopRatedRestaurants);
router.post('/:restaurantId/rate', authenticate, rateRestaurant);
router.get("/:restaurantId",getRestaurantById)
router.patch("/:restaurantId/status/update",updateStatus)
router.put("/edit/:restaurantId", authenticate, 
    upload.fields([{ name: 'logo' },
         { name: 'banner_image' }]),
          edtRestaurant);
// router.get("/get-orders/:restaurantId",getRestaurantOrders)
router.post("/sendOrderDetails/",getOrderDetails)



// order management service will call this endpoint to get restaurant details(Dulmi)
router.get("/:restaurantId/menu", menuController.getMenusByRestaurant);// order management service will call this endpoint to get restaurant menu(Dulmi)



module.exports = router;
