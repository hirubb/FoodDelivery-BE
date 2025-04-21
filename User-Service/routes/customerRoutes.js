const express = require("express");
const router = express.Router();
const { registerCustomer, loginCustomer, profile, getAllUsers } = require("../Controller/customerController");
const authenticate = require("../middleware/customerAuth");

router.post("/register", registerCustomer); // No upload middleware needed
router.post("/login", loginCustomer);
router.get("/my-details", authenticate, profile);
router.get("/", getAllUsers);

module.exports = router;
