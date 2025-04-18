const express = require("express");
const router = express.Router();
const { registerRestaurantOwner,loginRestaurantOwner,profile } = require("../controllers/restaurantOwnerController");
const authenticate = require("../middleware/authMiddleware"); 
const upload = require("../middleware/upload");


router.post("/register",upload.single("profile_image"), registerRestaurantOwner);
router.post("/login", loginRestaurantOwner);
router.get("/my-details", authenticate, profile);



module.exports = router;
