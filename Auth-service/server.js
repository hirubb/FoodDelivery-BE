const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(bodyParser.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Sample route
app.get("/", (req, res) => {
  res.send("Hello, Expressss!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Auth service http://localhost:${PORT}`);
});



app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const services = [
    { name: "Admin", url: "http://localhost:4001/api/admin" },
    { name: "RestaurantOwner", url: "http://localhost:4000/api/restaurant-owners"},
    // { name: "DeliveryPerson", url: "http://localhost:6000/api/delivery-persons" },
    // { name: "Customer", url: "http://localhost:7000/api/customers" },
  ];

  try {
    // Fetch users from all services
    const results = await Promise.all(
      services.map(async (service) => {
        const res = await axios.get(service.url);
        console.log(`🔍 Response from ${service.name}:`, res.data);
        return {
          users: res.data.users,
          role: service.name,
        };
      })
    );

    // Search for the user in all roles
    for (let result of results) {
      const user = result.users.find((u) => u.email === email);

      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          // Inside isMatch check
          const token = jwt.sign(
            {
              id: user._id,
              role: user.role,
            },
            process.env.JWT_SECRET
          );

          return res.status(200).json({
            message: "Login successful",
            token,
            user: {
              id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role,
            },
          });
        } else {
          return res.status(401).json({ message: "Invalid password" });
        }
      }
    }

    return res.status(404).json({ message: "User not found" });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});
