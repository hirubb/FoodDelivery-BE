const RestaurantOwner = require("../models/RestaurantOwner");
const Restaurant = require("../models/Restaurant");
const axios = require('axios');

const registerRestaurant = async (req, res) => {
  try {
    const {name, email, phone, address, city, country, cuisine_type,latitude,longitude } = req.body;

  
    // const { latitude, longitude } = await getCoordinates(address);

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
    
    });

    // Save the new restaurant
    await newRestaurant.save();
    return res.status(201).json({ message: "Restaurant registered successfully", restaurant: newRestaurant });

  } catch (error) {
    console.error("Error registering restaurant:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// const getCoordinates = async (address) => {
//   try {
//     const apiKey = process.env.GOOGLE_API_KEY;
//     const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
//       params: {
//         address,
//         key: apiKey
//       }
//     });
    
//     const data = response.data;
//     if (data.status === 'OK') {
//       const { lat, lng } = data.results[0].geometry.location;
//       return { latitude: lat, longitude: lng };
//     } else {
//       throw new Error('Unable to get coordinates');
//     }
//   } catch (error) {
//     console.error(error);
//     throw new Error('Geocoding API error');
//   }
// };

// Exporting all functions at the end
module.exports = {
  registerRestaurant,
};
