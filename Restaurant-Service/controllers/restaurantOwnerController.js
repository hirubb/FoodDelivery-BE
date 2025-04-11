require('dotenv').config();  // Ensure this is added at the top of your file

const jwt = require("jsonwebtoken");
const RestaurantOwner = require("../models/RestaurantOwner");
const bcrypt = require("bcryptjs"); // Add bcrypt to verify the password

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

const loginRestaurantOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the Restaurant Owner exists by email
    let owner;
    if (email) {
      owner = await RestaurantOwner.findOne({ email });
    }

    if (!owner) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify the password
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create a JWT token for the logged-in restaurant owner
    const token = jwt.sign(
      { userId: owner._id, role: owner.role },
      process.env.JWT_SECRET
    );

    // Respond with the token and user details
    return res.status(200).json({
      message: "Login successful",
      owner: {
        first_name: owner.first_name,
        last_name: owner.last_name,
        email: owner.email,
        username: owner.username,
        phone: owner.phone,
        role: owner.role,
        profile_image: owner.profile_image,
      },
      token,
    });

  } catch (error) {
    console.error("Error logging in restaurant owner:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};
const profile = async (req, res) => {
  try {
    const owner = await RestaurantOwner.findById(req.userId).select('-password');

    if (!owner) {
      return res.status(404).json({ message: "Restaurant Owner not found" });
    }

    return res.status(200).json({
      owner: {
        first_name: owner.first_name,
        last_name: owner.last_name,
        email: owner.email,
        username: owner.username,
        phone: owner.phone,
        role: owner.role,
        profile_image: owner.profile_image,
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};





module.exports = {
  registerRestaurantOwner,
  loginRestaurantOwner,
  profile

};
