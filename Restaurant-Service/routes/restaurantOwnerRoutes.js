const express = require("express");
const router = express.Router();
const { registerRestaurantOwner,loginRestaurantOwner,profile } = require("../controllers/restaurantOwnerController");
const authenticate = require("../middleware/authMiddleware"); 


router.post("/register", registerRestaurantOwner);
router.post("/login", loginRestaurantOwner);
router.get("/my-details", authenticate, profile);



module.exports = router;
