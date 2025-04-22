require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const orderRoutes = require("./routes/orderRoutes.js");

const app = express();
app.use(cors());
app.use(express.json());

// app.js
app.use("/orders", orderRoutes);


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("MongoDB connected");
  app.listen(process.env.PORT, () => {
    console.log(`Order Service running on port ${process.env.PORT}`);
  });
}).catch(err => console.error(err));
