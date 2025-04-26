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
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Sample route
app.get("/", (req, res) => {
  res.send("Hello, Express Authentication Service");
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const services = [
    { name: "Admin", url: "http://localhost:4001/api/admin" },
    { name: "RestaurantOwner", url: "http://localhost:4000/api/restaurant-owners" },
    { name: "DeliveryPerson", url: "http://localhost:3001/api/driver/getAll" },
    { name: "Customer", url: "http://localhost:7000/api/customers" }
  ];

  try {
    // Use Promise.allSettled to handle individual service errors
    const results = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await axios.get(service.url);
          // console.log(`🔍 Response from ${service.name}:`, response.data);

          let users = [];

          // Handle different response structures
          if (service.name === "DeliveryPerson" && response.data.drivers) {
            // Extract user data from driver objects
            users = response.data.drivers
              .filter(driver => driver.user) // Ensure user exists
              .map(driver => ({
                ...driver.user, // Spread the user data
                _id: driver._id, // Use the driver ID
                role: "DeliveryPerson" // Add role
              }));
          }
          // Handle standard user response format
          else if (Array.isArray(response.data.users)) {
            users = response.data.users;
          }
          // Handle single user format
          else if (response.data.user) {
            users = [response.data.user];
          }

          return users.map(user => ({
            ...user,
            role: user.role || service.name // Preserve existing role or use service name
          }));
        } catch (error) {
          console.error(`Error fetching from ${service.name} service:`, error.message);
          return []; // Return empty array on error
        }
      })
    );

    // Flatten all user results into a single array
    const allUsers = results.flat();

    // Find user by email
    const user = allUsers.find(user => user.email === email);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Token expires in 8 hours
    );

    // Return successful login response
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        first_name: user.first_name || user.firstName, // Handle different field names
        last_name: user.last_name || user.lastName,
        email: user.email,
        role: user.role
      },
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Authentication service error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Auth service running on http://localhost:${PORT}`);
});
