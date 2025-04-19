const express = require("express");
const router = express.Router();
const { registerAdmin,loginAdmin } = require("../controllers/AdminController");

const authenticate = require("../middleware/authMiddleware"); 
const upload = require("../middleware/upload");

router.post("/register",upload.single("profile_image"), registerAdmin);
router.post("/login", loginAdmin);

module.exports = router;