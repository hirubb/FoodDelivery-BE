const RestaurantOwner = require("../models/RestaurantOwner");
const Restaurant = require("../models/Restaurant");
const axios = require('axios');
const getCoordinates = require("../utils/geocode");

const nodemailer = require("nodemailer");
const twilio = require("twilio");
const MenuItems = require("../models/MenuItems");

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL;

// Twilio setup
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const registerRestaurant = async (req, res) => {
  try {
    const {name, email, phone, street,state,postal_code, license,opHrs,opDays,city, country, cuisine_type } = req.body;
    // const { latitude, longitude } = await getCoordinates(address);

    const fullAddress = `${street}, ${city}, ${state},${country}`;
    const { latitude, longitude } = await getCoordinates(fullAddress);

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
    const existingRestaurant = await Restaurant.findOne({ name, fullAddress });

    if (existingRestaurant) {
      return res.status(400).json({ message: "Restaurant with this name or address already exists!" });
    }

    // Create a new restaurant
    const newRestaurant = new Restaurant({
      owner_id: ownerId,
      name,
      email,
      phone,
      city,
      street,
      state,
      postal_code,
      license,
      opHrs,
      country,
      cuisine_type,
      latitude,
      longitude,
      logo: logoUrl,
      banner_image: bannerImageUrl,
      opDays
    
    });

    // Save the new restaurant
    await newRestaurant.save();

    const adminServiceURL = "http://localhost:4001/api/admin/notifyRegistration";
    try {
      const response = await axios.post(adminServiceURL, {
        restaurant: newRestaurant, 
      });
    
      console.log("Admin notified successfully:", response.data);
    } catch (notifyError) {
      console.error("Failed to notify admin service:", notifyError.message);
    }



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
const getApprovedRestaurants = async (req, res) => {
  try {
    const { searchTerm, cuisine_type } = req.query;

    const filter = {
      status: 'approved' ,// Always only fetch approved restaurants
      availability:true
    };

    if (searchTerm) {
      // Match searchTerm with name OR city OR cuisine_type
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { city: { $regex: searchTerm, $options: 'i' } },
        { cuisine_type: { $regex: searchTerm, $options: 'i' } },
       
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

const getAllRestaurants = async (req, res) => {
  try {
    const { searchTerm, cuisine_type } = req.query;

    const filter ={}
    
    if (searchTerm) {
      // Match searchTerm with name OR city OR cuisine_type
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { city: { $regex: searchTerm, $options: 'i' } },
        { cuisine_type: { $regex: searchTerm, $options: 'i' } },
       
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

const updateAvailability = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { availability } = req.body;
    const userId = req.userId; // Assuming the userId is set via authentication middleware

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    if (restaurant.owner_id.toString() !== userId) {
      return res.status(403).json({ message: 'You are not authorized to update this restaurant.' });
    }

    // Step 2: Update availability
    restaurant.availability = availability;

    // Step 3: Save the updated restaurant
    await restaurant.save();

    // Step 4: Return the updated availability
    res.status(200).json({
      message: 'Availability updated successfully.',
      availability: restaurant.availability
    });
  } catch (error) {
    console.error('Error setting restaurant availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getRestaurantById = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    res.status(200).json({
      message: "Restaurant found successfully.",
      data: restaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant by ID:', error);
    res.status(500).json({ message: 'Server error while fetching restaurant.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    // If `status` is a string
    restaurant.status = "approved";
    await restaurant.save();

    res.status(200).json({ message: 'Status updated successfully.', status: restaurant.status });
  } catch (error) {
    console.error("Error updating status:", error.message);
    res.status(500).json({ message: 'Server error while updating status.' });
  }
};

const edtRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const {
      name,
      email,
      phone,
      street,
      city,
      state,
      postal_code,
      country,
      license,
      opHrs,
      opDays,
      cuisine_type,
      
    } = req.body;

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    // Ensure that only the owner can update the restaurant
    const userId = req.userId;
    if (restaurant.owner_id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to edit this restaurant.' });
    }

    // Update fields
    if (name) restaurant.name = name;
    if (email) restaurant.email = email;
    if (phone) restaurant.phone = phone;
    if (street) restaurant.street = street;
    if (city) restaurant.city = city;
    if (state) restaurant.state = state;
    if (postal_code) restaurant.postal_code = postal_code;
    if (license) restaurant.license = license;
    if (opHrs) restaurant.opHrs = opHrs;
    if (opDays) restaurant.opDays = opDays;
    if (country) restaurant.country = country;
    if (cuisine_type) restaurant.cuisine_type = cuisine_type;

    // Recalculate full address and coordinates if address fields changed
    if (street || city || state || country) {
      const fullAddress = `${restaurant.street}, ${restaurant.city}, ${restaurant.state}, ${restaurant.country}`;
      const { latitude, longitude } = await getCoordinates(fullAddress);
      restaurant.latitude = latitude;
      restaurant.longitude = longitude;
    }

    // Handle file updates
    if (req.files && req.files.logo) {
      restaurant.logo = req.files.logo[0].path;
    }
    if (req.files && req.files.banner_image) {
      restaurant.banner_image = req.files.banner_image[0].path;
    }

    await restaurant.save();

    return res.status(200).json({
      message: 'Restaurant updated successfully.',
      data: restaurant,
    });

  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ message: 'Internal server error while updating restaurant.' });
  }
};

const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);
    

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    
    // return res.status(200).json({ message: "Restaurant found" });
    const orderRes = await axios.get(`${ORDER_SERVICE_URL}/${restaurantId}`);

    return res.status(200).json(orderRes.data);
  } catch (error) {
    console.error("Error fetching restaurant orders:", error.message);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ message: "No orders received" });
    }

    const enrichedOrders = [];

    for (const order of orders) {
      const populatedItems = [];

      for (const item of order.items) {
        const menuItem = await MenuItems.findById(item.menuItemId);

        if (menuItem) {
          populatedItems.push({
            menuItem,
            quantity: item.quantity
          });
        } else {
          console.warn(`Menu item not found for ID: ${item.menuItemId}`);
        }
      }

      enrichedOrders.push({
        orderId: order._id,
        restaurantId: order.restaurantId,
        items: populatedItems,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt : order.createdAt
      });
    }

    return res.status(200).json({ orders: enrichedOrders });
  } catch (error) {
    console.error("Error fetching restaurant orders:", error.message);
    return res.status(500).json({ message: "Something went wrong" });
  }
};








// Exporting all functions at the end
module.exports = {
  registerRestaurant,
  myRestaurants,
  getAllRestaurants,
  rateRestaurant,
  getTopRatedRestaurants,
  getRestaurantById,
  updateStatus,
  edtRestaurant,
  getRestaurantOrders,
  getOrderDetails,
  getApprovedRestaurants,
  updateAvailability

};
