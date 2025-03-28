require('dotenv').config();  // Ensure this is added at the top of your file

const jwt = require("jsonwebtoken");
const RestaurantOwner = require("../models/RestaurantOwner");

const registerRestaurantOwner = async (req, res) => {
  try {
    const { first_name, last_name, email, username, password, phone, profile_image } = req.body;

    const existingOwnerByEmail = await RestaurantOwner.findOne({ email });
    const existingOwnerByUsername = await RestaurantOwner.findOne({ username });

    if (existingOwnerByEmail) {
      return res.status(400).json({ message: "Email is already registered!" });
    }

    if (existingOwnerByUsername) {
      return res.status(400).json({ message: "Username is already taken!" });
    }

    const newOwner = new RestaurantOwner({
      first_name,
      last_name,
      email,
      username,
      password,
      phone,
      profile_image,
    });

    await newOwner.save();

    const token = jwt.sign({ userId: newOwner._id, role: newOwner.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(201).json({
      message: "Restaurant Owner registered successfully",
      owner: {
        first_name: newOwner.first_name,
        last_name: newOwner.last_name,
        email: newOwner.email,
        username: newOwner.username,
        phone: newOwner.phone,
        role: newOwner.role,
        profile_image: newOwner.profile_image,
      },
      token,
    });

  } catch (error) {
    console.error("Error registering restaurant owner:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

module.exports = {
  registerRestaurantOwner,
};
