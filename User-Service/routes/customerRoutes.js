const express = require("express");
const router = express.Router();
const { registerCustomer, loginCustomer, profile, getAllUsers ,getCustomerById} = require("../Controller/customerController");
const authenticate = require("../middleware/customerAuth");

router.post("/register", registerCustomer); // No upload middleware needed
router.post("/login", loginCustomer);
router.get("/my-details", authenticate, profile);
router.get("/", getAllUsers);
router.get("/:customerId", getCustomerById);// order management service will call this endpoint to get customer details(Dulmi)

module.exports = router;
