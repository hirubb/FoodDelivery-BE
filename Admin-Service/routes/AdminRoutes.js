const express = require("express");
const router = express.Router();
const { registerAdmin,loginAdmin ,profile ,getAllUsers,getAllRestaurantOwners,getAllRestauants,approveRestaurant,getCustomers} = require("../controllers/AdminController");

const authenticate = require("../middleware/authMiddleware"); 
const upload = require("../middleware/upload");

router.post("/register",upload.single("profile_image"), registerAdmin);
router.post("/login", loginAdmin);
router.get("/my-details", authenticate , profile);
router.get("/", getAllUsers);
router.get("/restaurant-owners", getAllRestaurantOwners);
router.get("/restaurants", getAllRestauants);
router.get("/restaurants/:restaurantId/approve",approveRestaurant);
router.get("/customers",getCustomers);

module.exports = router;