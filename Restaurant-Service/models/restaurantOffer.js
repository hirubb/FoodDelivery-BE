const mongoose = require('mongoose');

const restaurantOfferSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true },
  description: {
    type: String,
    required: true
  },
  discount: { 
    type: Number, 
    required: true },
  code: {
    type: String,
    unique: true
  },
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

// Function to generate a random code
function generateCode() {
  const letters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');

  const numbers = Math.floor(100 + Math.random() * 900); 

  return `${letters}${numbers}`;
}

// Pre-save hook to set a unique code
restaurantOfferSchema.pre('save', async function (next) {
  if (!this.code) {
    let unique = false;
    while (!unique) {
      const newCode = generateCode();
      const existing = await mongoose.models.RestaurantOffer.findOne({ code: newCode });
      if (!existing) {
        this.code = newCode;
        unique = true;
      }
    }
  }
  next();
});



module.exports = mongoose.model('RestaurantOffer', restaurantOfferSchema);
