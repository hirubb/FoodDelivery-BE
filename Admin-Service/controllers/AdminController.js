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
  
      const token = jwt.sign({ id: newOwner._id, role: newOwner.role }, process.env.JWT_SECRET);
  
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

  const getAllUsers = async (req, res) => {
    try {
      const users = await Admin.find();
      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No users found." });
      }
  
      return res.status(200).json({ users });
    } catch (error) {
      console.error("Error fetching all users:", error);
      return res.status(500).json({ message: "Server error while fetching users." });
    }
  };
  
  const axios = require("axios");

const getAllRestaurantOwners = async (req, res) => {
  try {
    // Replace with the actual URL of your Restaurant-Service
    const restaurantServiceURL = "http://localhost:4000/api/restaurant-owners/"; // example endpoint

    const response = await axios.get(restaurantServiceURL);

    return res.status(200).json({
      message: "Fetched restaurant owners successfully",
      restaurantOwners: response.data
    });

  } catch (error) {
    console.error("Error fetching restaurant owners:", error.message);
    return res.status(500).json({ message: "Failed to fetch restaurant owners" });
  }
};

const getAllRestauants = async(req, res)=>{

  try {
    // Replace with the actual URL of your Restaurant-Service
    const restaurantServiceURL = "http://localhost:4000/api/restaurant/"; 

    const response = await axios.get(restaurantServiceURL);

    return res.status(200).json({
      message: "Fetched restaurants successfully",
      restaurants: response.data
    });

  } catch (error) {
    console.error("Error fetching restaurants:", error.message);
    return res.status(500).json({ message: "Failed to fetch restaurants" });
  }
}
const approveRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurantServiceURL = `http://localhost:4000/api/restaurant/${restaurantId}`; 

    // Fetch the restaurant first
    const response = await axios.get(restaurantServiceURL);
    const restaurantData = response.data;

    if (!restaurantData) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Update the status to "approved"
    const updateURL = `http://localhost:4000/api/restaurant/${restaurantId}/status/update`;
    const statusResponse = await axios.patch(updateURL, { status: "approved" });

    return res.status(200).json({
      message: "Restaurant approved successfully",
      data: statusResponse.data
    });

  } catch (error) {
    console.error("Error approving restaurant:", error.message);
    return res.status(500).json({ message: "Failed to approve restaurant" });
  }
};

const getCustomers = async (req, res) => {
  const customerServiceURL = "http://localhost:6000/api/customers/";

  try {
    const response = await axios.get(customerServiceURL);
    const customers = response.data;

    if (!customers || customers.length === 0) {
      return res.status(404).json({ message: "No customers found." });
    }

    res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error.message);
    res.status(500).json({ message: "Failed to fetch customers.", error: error.message });
  }
};



  module.exports = {
    registerAdmin,
    loginAdmin,
    profile,
    getAllUsers,
    getAllRestaurantOwners,
    getAllRestauants,
    approveRestaurant,
    getCustomers
  
  };