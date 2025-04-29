const RestaurantOffer = require('../models/restaurantOffer');
const SystemOffer = require('../models/systemOffer');
const Restaurant = require("../models/Restaurant");

// Create an offer
exports.createOffer = async (req, res) => {
  try {
    const {type, restaurantId, ...offerData } = req.body;

    let offer;

    // Check if the user is authenticated
    if (!req.userId) {
      return res.status(403).json({ success: false, message: 'No authenticated user' });
    }

    if (type === 'restaurant') {
      // Ensure the user is a restaurant owner
      if (req.role !== 'Restaurant Owner') {
        return res.status(403).json({ success: false, message: 'Unauthorized: You are not a restaurant owner' });
      }

      // Check if restaurantId is provided
      if (!restaurantId) {
        return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
      }

      // Validate that the restaurant exists and belongs to the user
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }

      if (restaurant.owner_id.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized: This restaurant does not belong to you' });
      }

      // Set the restaurant owner and restaurant fields for the offer
      offerData.restaurantOwner = req.userId; // Use the logged-in user's ID
      offerData.restaurant = restaurantId; // Link the offer to the restaurant
      offer = new RestaurantOffer(offerData);
    } else if (type === 'system') {
      // Ensure the user is an admin
      if (req.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized: You are not an admin' });
      }

      offerData.createdByAdmin = req.userId;
      offer = new SystemOffer(offerData);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid offer type' });
    }

    // Save the offer
    await offer.save();
    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

  exports.getAllOffers = async (req, res) => {
    try {
      // Fetch both system and restaurant offers
      const systemOffers = await SystemOffer.find().populate('createdByAdmin').exec();
      const restaurantOffers = await RestaurantOffer.find().populate('restaurantOwner').exec();
  
      // Combine both offers into one array
      const allOffers = [...systemOffers, ...restaurantOffers];
  
      res.json({ success: true, data: allOffers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  exports.getAllRestaurantOffers = async (req, res) => {
    try {
      const restaurantOffers = await RestaurantOffer.find()
        .populate('restaurant') // populate restaurant details
        .populate('restaurantOwner') // optionally include owner details too
        .exec();
  
      res.json({ success: true, data: restaurantOffers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };


 // Get offers by restaurant ID
exports.getOffersByRestaurantId = async (req, res) => {
  try {
    const userId = req.userId;
    const restaurantId = req.params.restaurantId;

    // Ensure the user is a restaurant owner
    if (req.role !== 'Restaurant Owner') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only restaurant owners can view this.' });
    }

    // Check if the restaurant exists and belongs to the current user
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    if (restaurant.owner_id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: This restaurant does not belong to you.' });
    }

    // Fetch offers linked to the restaurant
    const offers = await RestaurantOffer.find({ restaurant: restaurantId })
      .populate('restaurant')
      .populate('restaurantOwner');

    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};







exports.editOffer = async (req, res) => {
  try {
    const { ...updateData } = req.body;
    const { offerId } = req.params;


    const type = "restaurant";
    // Check if the user is authenticated
    if (!req.userId) {
      return res.status(403).json({ success: false, message: 'No authenticated user' });
    }

    let offer;

    if (type === 'restaurant') {
      // Ensure the user is a restaurant owner
      if (req.role !== 'Restaurant Owner') {
        return res.status(403).json({ success: false, message: 'Unauthorized: You are not a restaurant owner' });
      }

      // Find the offer
      offer = await RestaurantOffer.findById(offerId);
      if (!offer) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      // Check if the offer belongs to the current restaurant owner
      if (offer.restaurantOwner.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized: You cannot edit this offer' });
      }
    } else if (type === 'system') {
      // Ensure the user is an admin
      if (req.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized: You are not an admin' });
      }

      // Find the offer
      offer = await SystemOffer.findById(offerId);
      if (!offer) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      // Check if the admin created this offer (optional — remove this if any admin can edit any system offer)
      if (offer.createdByAdmin.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized: You cannot edit this system offer' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid offer type' });
    }

    // Update the offer with new data
    Object.assign(offer, updateData);

    await offer.save();

    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};






