require('dotenv').config(); 
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs"); // Add bcrypt to verify the password

const registerAdmin = async (req, res) => {
    try {
      const { first_name, last_name, email, username, password, phone } = req.body;
  
      const existingOwnerByEmail = await Admin.findOne({ email });
      const existingOwnerByUsername = await Admin.findOne({ username });
  
      if (existingOwnerByEmail) {
        return res.status(400).json({ message: "Email is already registered!" });
      }
  
      if (existingOwnerByUsername) {
        return res.status(400).json({ message: "Username is already taken!" });
      }
  
      const profile_image = req.file ? req.file.path : null;
  
      const newOwner = new Admin({
        first_name,
        last_name,
        email,
        username,
        password,
        phone,
        profile_image,
      });
  
      await newOwner.save();
  
      const token = jwt.sign({ userId: newOwner._id, role: newOwner.role }, process.env.JWT_SECRET);
  
      return res.status(201).json({
        message: "Admin registered successfully",
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
      console.error("Error registering Admin:", error);
      return res.status(500).json({ message: "Server error. Please try again later." });
    }
  };

  const loginAdmin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      let admin;
      if (email) {
        admin = await Admin.findOne({ email });
      }
  
      if (!admin) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      // Verify the password
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      // Create a JWT token for the logged-in restaurant admin
      const token = jwt.sign(
        { userId: admin._id, role: admin.role },
        process.env.JWT_SECRET
      );
  
      // Respond with the token and user details
      return res.status(200).json({
        message: "Login successful",
        owner: {
          first_name: admin.first_name,
          last_name: admin.last_name,
          email: admin.email,
          username: admin.username,
          phone: admin.phone,
          role: admin.role,
          profile_image: admin.profile_image,
        },
        token,
      });
  
    } catch (error) {
      console.error("Error logging in Admin:", error);
      return res.status(500).json({ message: "Server error. Please try again later." });
    }
  };

  const profile = async (req, res) => {
    try {
      const admin = await Admin.findById(req.userId).select('-password');
  
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
  
      return res.status(200).json({
        admin: {
          first_name: admin.first_name,
          last_name: admin.last_name,
          email: admin.email,
          username: admin.username,
          phone: admin.phone,
          role: admin.role,
          profile_image: admin.profile_image,
        }
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      return res.status(500).json({ message: "Server error. Please try again later." });
    }
  };
  
  
  module.exports = {
    registerAdmin,
    loginAdmin,
    profile,
  
  };