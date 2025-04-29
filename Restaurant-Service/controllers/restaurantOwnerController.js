require('dotenv').config();  // Ensure this is added at the top of your file

const jwt = require("jsonwebtoken");
const RestaurantOwner = require("../models/RestaurantOwner");
const bcrypt = require("bcryptjs"); // Add bcrypt to verify the password

const registerRestaurantOwner = async (req, res) => {
  try {
    const { first_name, last_name, email, username, password, phone,nic } = req.body;

    const existingOwnerByEmail = await RestaurantOwner.findOne({ email });
    const existingOwnerByUsername = await RestaurantOwner.findOne({ username });
    const existingOwnerByPhone = await RestaurantOwner.findOne({ phone });

    if (existingOwnerByEmail) {
      return res.status(400).json({ message: "Email is already registered!" });
    }

    if (existingOwnerByUsername) {
      return res.status(400).json({ message: "Username is already taken!" });
    }

    if (existingOwnerByPhone) {
      return res.status(400).json({ message: "Phone number is already taken!" });
    }

    const profile_image = req.file ? req.file.path : null;

    const newOwner = new RestaurantOwner({
      first_name,
      last_name,
      email,
      username,
      password,
      phone,
      profile_image,
      nic
    });

    await newOwner.save();
  
    const token = jwt.sign({ id: newOwner._id, role: newOwner.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
        nic: newOwner.nic
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
    console.log("owner : ", owner);

    if (!owner) {
      return res.status(404).json({ message: "Restaurant Owner not found" });
    }

    return res.status(200).json({
      owner: {
        id: owner._id,
        first_name: owner.first_name,
        last_name: owner.last_name,
        email: owner.email,
        username: owner.username,
        phone: owner.phone,
        role: owner.role,
        profile_image: owner.profile_image,
        nic: owner.nic,
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

//get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await RestaurantOwner.find();
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching all users:", error);
    return res.status(500).json({ message: "Server error while fetching users." });
  }
};
const editRestaurantOwner = async (req, res) => {
  try {
    const ownerId = req.params.id;
    const {
      first_name,
      last_name,
      email,
      username,
      phone,
      nic,
      password, 
    } = req.body;

    const updateData = {
      first_name,
      last_name,
      email,
      username,
      phone,
      nic,
    };

    // Handle optional profile image update
    if (req.file) {
      updateData.profile_image = req.file.path;
    }

    // Handle optional password update
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedOwner = await RestaurantOwner.findByIdAndUpdate(
      ownerId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedOwner) {
      return res.status(404).json({ message: "Restaurant Owner not found" });
    }

    return res.status(200).json({
      message: "Restaurant Owner updated successfully",
      owner: updatedOwner,
    });

  } catch (error) {
    console.error("Error updating restaurant owner:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const deleteOwnerById = async(req,res) => {
  const ownerId = req.params.ownerId;
  try {
    const deletedOwner = await RestaurantOwner.findByIdAndDelete(ownerId);
    if (!deletedOwner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    res.status(200).json({ message: 'Owner deleted successfully' });
  } catch (error) {
    console.error('Error deleting Owner:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

}

module.exports = {
  registerRestaurantOwner,
  loginRestaurantOwner,
  profile,
  getAllUsers,
  editRestaurantOwner,
  deleteOwnerById

};
