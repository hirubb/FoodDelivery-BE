const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant"); // Adjust path if needed
const RestaurantOwner = require("../models/RestaurantOwner"); // Adjust path if needed
const { getCoordinates } = require("../utils/geocode"); // Utility function for fetching latitude and longitude

// Sample restaurant data
const restaurants = [
  {
    name: "The Seafood Delight",
    email: "seafood@delight.com",
    phone: "1234567890",
    street: "123 Ocean Drive",
    city: "Colombo",
    state: "Western",
    postal_code: "10100",
    license: "ABC123",
    opHrs: ["9:00 AM - 9:00 PM"],
    opDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    cuisine_type: ["Seafood", "Italian"],
  },
  {
    name: "Veggie Heaven",
    email: "veggie@heaven.com",
    phone: "0987654321",
    street: "456 Green St",
    city: "Kandy",
    state: "Central",
    postal_code: "20000",
    license: "XYZ456",
    opHrs: ["10:00 AM - 10:00 PM"],
    opDays: ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
    cuisine_type: ["Vegetarian", "Vegan"],
  },
  // Add more sample data as needed
];

async function seedRestaurants() {
  try {
    // Connect to the database
    await mongoose.connect("mongodb://localhost:27017/your-db-name", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Find a restaurant owner to associate with the restaurants
    const owner = await RestaurantOwner.findOne(); // Get the first available owner. Modify if you need specific ones.

    if (!owner) {
      console.log("No restaurant owner found in the database.");
      return;
    }

    // Loop through the restaurants and insert them
    for (const restaurantData of restaurants) {
      const fullAddress = `${restaurantData.street}, ${restaurantData.city}, ${restaurantData.state}, ${restaurantData.country || "Sri Lanka"}`;
      const { latitude, longitude } = await getCoordinates(fullAddress);

      const existingRestaurant = await Restaurant.findOne({ name: restaurantData.name, fullAddress });

      if (existingRestaurant) {
        console.log(`Restaurant '${restaurantData.name}' already exists.`);
        continue;
      }

      const newRestaurant = new Restaurant({
        owner_id: owner._id,
        name: restaurantData.name,
        email: restaurantData.email,
        phone: restaurantData.phone,
        street: restaurantData.street,
        city: restaurantData.city,
        state: restaurantData.state,
        postal_code: restaurantData.postal_code,
        license: restaurantData.license,
        opHrs: restaurantData.opHrs,
        opDays: restaurantData.opDays,
        cuisine_type: restaurantData.cuisine_type,
        latitude,
        longitude,
        logo: "path/to/logo", // You can either provide a path or leave it out if not using logos
        banner_image: "path/to/banner_image", // Same for banner image
      });

      await newRestaurant.save();
      console.log(`Restaurant '${restaurantData.name}' added successfully.`);
    }

    mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding data:", error);
    mongoose.disconnect();
  }
}

// Run the seeder
seedRestaurants();
