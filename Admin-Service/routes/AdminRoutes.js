const express = require("express");
const router = express.Router();
const { registerAdmin,loginAdmin ,profile ,getAllUsers} = require("../controllers/AdminController");

const authenticate = require("../middleware/authMiddleware"); 
const upload = require("../middleware/upload");

router.post("/register",upload.single("profile_image"), registerAdmin);
router.post("/login", loginAdmin);
router.get("/my-details", authenticate , profile);
router.get("/", getAllUsers)

module.exports = router;