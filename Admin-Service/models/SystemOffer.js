const mongoose = require('mongoose');

const systemOfferSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  discount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  code: {
    type: String,
    unique: true
  },
  validUntil: Date,
  createdByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
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

  const numbers = Math.floor(100 + Math.random() * 900); // Ensures 3 digits

  return `${letters}${numbers}`;
}

// Pre-save hook to set a unique code
systemOfferSchema.pre('save', async function (next) {
  if (!this.code) {
    let unique = false;
    while (!unique) {
      const newCode = generateCode();
      const existing = await mongoose.models.SystemOffer.findOne({ code: newCode });
      if (!existing) {
        this.code = newCode;
        unique = true;
      }
    }
  }
  next();
});

module.exports = mongoose.model('SystemOffer', systemOfferSchema);
