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
  
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
  
    // Handle duplicate key error (e.g., unique constraint violation)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({ message: `Duplicate value for field: ${field}` });
    }
  
    // Default fallback
    return res.status(500).json({ message: "Internal server error. Please try again later." });
  }
};



const myRestaurants = async(req,res)=>{

  try {
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
const getAllRestaurants = async (req, res) => {
  try {
    const { searchTerm, cuisine_type } = req.query;

    const filter = {};

    if (searchTerm) {
      // Match searchTerm with name OR city OR cuisine_type
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { city: { $regex: searchTerm, $options: 'i' } },
        { cuisine_type: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    if (cuisine_type) {
      filter.cuisine_type = { $regex: cuisine_type, $options: 'i' };
    }

    const restaurants = await Restaurant.find(filter);

    if (!restaurants || restaurants.length === 0) {
      return res.status(404).json({
        message: "No matching restaurants found",
      });
    }

    res.status(200).json({
      message: "Restaurants fetched successfully",
      data: restaurants,
    });

  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};


const rateRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { rating, review } = req.body;
    const userId = req.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    // Optional: Prevent the same user from rating multiple times
    const alreadyRated = restaurant.ratings.find(r => r.userId.toString() === userId);
    if (alreadyRated) {
      return res.status(400).json({ message: 'You have already rated this restaurant.' });
    }

    // Add new rating
    restaurant.ratings.push({ rating, review });

    // Update average rating
    const total = restaurant.ratings.reduce((acc, curr) => acc + curr.rating, 0);
    restaurant.averageRating = total / restaurant.ratings.length;

    await restaurant.save();

    res.status(200).json({ message: 'Rating submitted successfully.', averageRating: restaurant.averageRating });
  } catch (error) {
    console.error('Error rating restaurant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const getTopRatedRestaurants = async (req, res) => {
  try {
    const topRestaurants = await Restaurant.find()
      .sort({ averageRating: -1 }) 
      .limit(6); // Only take top 6

    res.status(200).json({
      message: 'Top rated restaurants fetched successfully.',
      data: topRestaurants,
    });
  } catch (error) {
    console.error('Error fetching top rated restaurants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Exporting all functions at the end
module.exports = {
  registerRestaurant,
  myRestaurants,
  getAllRestaurants,
  rateRestaurant,
  getTopRatedRestaurants
};
