require('dotenv').config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Customer = require("../models/Customer");

const registerCustomer = async (req, res) => {
  try {
    const { first_name, last_name, email, username, password, phone } = req.body;

    const existingEmail = await Customer.findOne({ email });
    const existingUsername = await Customer.findOne({ username });

    if (existingEmail) return res.status(400).json({ message: "Email is already registered!" });
    if (existingUsername) return res.status(400).json({ message: "Username is already taken!" });

    const newCustomer = new Customer({
      first_name,
      last_name,
      email,
      username,
      password,
      phone,
    });

    await newCustomer.save();

    const token = jwt.sign({ id: newCustomer._id, role: newCustomer.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(201).json({
      message: "Customer registered successfully",
      customer: {
        first_name: newCustomer.first_name,
        last_name: newCustomer.last_name,
        email: newCustomer.email,
        username: newCustomer.username,
        phone: newCustomer.phone,
        role: newCustomer.role,
      },
      token,
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Make sure we're consistent with the id field name
    const token = jwt.sign({ 
      id: customer._id, 
      role: customer.role 
    }, process.env.JWT_SECRET);

    return res.status(200).json({
      message: "Login successful",
      customer: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        username: customer.username,
        phone: customer.phone,
        role: customer.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const profile = async (req, res) => {
  try {
    console.log("Looking for customer with ID:", req.userId);
    
    const customer = await Customer.findById(req.userId).select('-password');
    
    if (!customer) {
      console.log("No customer found with ID:", req.userId);
      return res.status(404).json({ message: "Customer not found" });
    }

    console.log("Customer found:", customer);
    return res.status(200).json({ customer });
  } catch (error) {
    console.error("Profile fetch error:", error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: "Invalid customer ID format" });
    }
    return res.status(500).json({ message: "Server error." });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await Customer.find();
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching all users:", error);
    return res.status(500).json({ message: "Server error while fetching users." });
  }
};

// get id  from order service and fetch customer details from user service(Dulmi)
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId)
      .select('-password'); // Exclude password

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({ customer });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteCustomerById = async(req,res) => {
  const customerId = req.params.customerId;
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(customerId);
    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

}

const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, email, username, phone, password, delivery_address, city, postal_code } = req.body;
    
    // Find the customer by ID from the authenticated token
    const customer = await Customer.findById(req.userId);
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    // Check if email is already in use by another user
    if (email !== customer.email) {
      const existingEmail = await Customer.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }
    
    // Check if username is already in use by another user
    if (username !== customer.username) {
      const existingUsername = await Customer.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }
    
    // Update the customer's data
    customer.first_name = first_name || customer.first_name;
    customer.last_name = last_name || customer.last_name;
    customer.email = email || customer.email;
    customer.username = username || customer.username;
    customer.phone = phone || customer.phone;
    
    // Optional fields
    if (delivery_address !== undefined) customer.delivery_address = delivery_address;
    if (city !== undefined) customer.city = city;
    if (postal_code !== undefined) customer.postal_code = postal_code;
    
    // Only update password if provided
    if (password) {
      customer.password = password; // This will be hashed by the mongoose pre-save hook
    }
    
    // Save the updated customer
    await customer.save();
    
    // Return the updated customer without the password
    const updatedCustomer = await Customer.findById(req.userId).select('-password');
    
    return res.status(200).json({ 
      message: "Profile updated successfully", 
      customer: updatedCustomer 
    });
    
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  profile,
  getAllUsers,
  getCustomerById,
  deleteCustomerById,
  updateProfile
};
