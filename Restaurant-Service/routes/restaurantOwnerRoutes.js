const express = require("express");
const router = express.Router();
const { registerRestaurantOwner,loginRestaurantOwner,profile,getAllUsers,editRestaurantOwner,deleteOwnerById } = require("../controllers/restaurantOwnerController");
const authenticate = require("../middleware/authMiddleware"); 
const upload = require("../middleware/upload");


router.post("/register",upload.single("profile_image"), registerRestaurantOwner);
router.post("/login", loginRestaurantOwner);
router.get("/my-details", authenticate, profile);
router.get("/", getAllUsers);
router.put("/edit/:id", upload.single("profile_image"), editRestaurantOwner);

router.delete('/delete/:ownerId', deleteOwnerById);


module.exports = router;
