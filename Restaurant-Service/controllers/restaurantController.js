const RestaurantOwner = require("../models/RestaurantOwner");
const Restaurant = require("../models/Restaurant");
const axios = require('axios');

const registerRestaurant = async (req, res) => {
  try {
    const {name, email, phone, address, city, country, cuisine_type,latitude,longitude } = req.body;
    // const { latitude, longitude } = await getCoordinates(address);

        // Check if files are uploaded
        let logoUrl = null;
        let bannerImageUrl = null;
        if (req.files && req.files.logo) {
          logoUrl = req.files.logo[0].path; // Get the file path for logo
        }
    
        if (req.files && req.files.banner_image) {
          bannerImageUrl = req.files.banner_image[0].path; // Get the file path for banner image
        }

    const userId = req.userId;
    const owner = await RestaurantOwner.findById(userId);
  
    const ownerId = owner._id;

    if (!owner) {
      return res.status(404).json({ message: "Restaurant owner not found!" });
    }

    // Check if the restaurant already exists with the same name and address
    const existingRestaurant = await Restaurant.findOne({ name, address });

    if (existingRestaurant) {
      return res.status(400).json({ message: "Restaurant with this name or address already exists!" });
    }

    // Create a new restaurant
    const newRestaurant = new Restaurant({
      owner_id: ownerId,
      name,
      email,
      phone,
      address,
      city,
      country,
      cuisine_type,
      latitude,
      longitude,
      logo: logoUrl,
      banner_image: bannerImageUrl,
    
    });

    // Save the new restaurant
    await newRestaurant.save();
    return res.status(201).json({ message: "Restaurant registered successfully", restaurant: newRestaurant });

  } catch (error) {
    console.error("Error registering restaurant:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};



const myRestaurants = async(req,res)=>{

  try {
    //get authenticates user id
    const userId = req.userId;

    if (!userId) {
      return res.status(404).json({ message: "Restaurant Owner not found" });
    }
    //find all restaurants owned by the user
    const restaurants = await Restaurant.find({ owner_id: userId });

    if(!restaurants) {
      return res.status(404).json({
        message:"Restaurants Not Found"
      })
    }
    return res.status(200).json({ message: "Restaurants found", restaurants });


    
  } catch (error) {
    return res.status(500).json({ message: "Server error. Please try again later." });
  }

}

// Exporting all functions at the end
module.exports = {
  registerRestaurant,
  myRestaurants
};
