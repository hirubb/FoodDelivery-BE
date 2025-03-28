const RestaurantOwner = require("../models/RestaurantOwner");
const Restaurant = require("../models/Restaurant");

// Controller for Restaurant Registration
const registerRestaurant = async (req, res) => {
  try {
    const { owner_id, name, email, phone, address, city, country, cuisine_type } = req.body;

    // Check if RestaurantOwner exists
    const owner = await RestaurantOwner.findById(owner_id);
    if (!owner) {
      return res.status(404).json({ message: "Restaurant owner not found!" });
    }

    // Check if the restaurant already exists with the same name
    const existingRestaurant = await Restaurant.findOne({ name });
    if (existingRestaurant) {
      return res.status(400).json({ message: "Restaurant with this name already exists!" });
    }

    // Create a new restaurant
    const newRestaurant = new Restaurant({
      owner_id,
      name,
      email,
      phone,
      address,
      city,
      country,
      cuisine_type,
    });

    // Save the new restaurant
    await newRestaurant.save();
    return res.status(201).json({ message: "Restaurant registered successfully", restaurant: newRestaurant });

  } catch (error) {
    console.error("Error registering restaurant:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Exporting all functions at the end
module.exports = {
  registerRestaurant,
};
