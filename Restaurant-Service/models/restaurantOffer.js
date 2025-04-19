const mongoose = require('mongoose');

const restaurantOfferSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  code: String,
  validUntil: Date,
  restaurantOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantOwner',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


module.exports = mongoose.model('RestaurantOffer', restaurantOfferSchema);
