const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(bodyParser.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Connect to MongoDB
mongoose
  .connect(DB_URI)
  .then(() => console.log("✅ Connected too MongoDB"))
  .catch((err) => console.error("❌ Could not connect to MongoDB:", err));

// Sample route
app.get("/", (req, res) => {
  res.send("Hello, Expressss!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});



//routes import
const restaurantRoutes = require("./routes/restaurantRoutes");
const restaurantOwnerRoutes = require("./routes/restaurantOwnerRoutes");
const menuRoutes = require("./routes/menuRoutes");
const menuItemRoutes = require("./routes/menuItemRoutes");
const offerRoutes = require('./routes/offerRoutes');

// Use restaurant routes
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/restaurant-owners", restaurantOwnerRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/menu-item", menuItemRoutes);
app.use('/api/offers', offerRoutes);
