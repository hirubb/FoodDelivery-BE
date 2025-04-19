const mongoose = require('mongoose');

const systemOfferSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  code: String,
  validUntil: Date,
  createdByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model where admin info is stored
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SystemOffer', systemOfferSchema);
