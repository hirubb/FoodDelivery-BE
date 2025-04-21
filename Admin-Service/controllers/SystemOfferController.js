const SystemOffer = require('../models/SystemOffer');

// Create a new system offer
exports.createSystemOffer = async (req, res) => {
  try {
    const { title, discount, description, validUntil } = req.body;

    if (!req.userId) {
        return res.status(403).json({ success: false, message: 'No authenticated user' });
    }

    const newOffer = new SystemOffer({
      title,
      discount,
      description,
      validUntil,
      createdByAdmin:req.userId,
    });

    const savedOffer = await newOffer.save();
    res.status(201).json(savedOffer);
  } catch (error) {
    console.error('Error creating system offer:', error);
    res.status(500).json({ error: 'Failed to create system offer' });
  }
};

// Get all system offers
exports.getAllSystemOffers = async (req, res) => {
  try {
    const offers = await SystemOffer.find().populate('createdByAdmin', 'name email');
    res.json(offers);
  } catch (error) {
    console.error('Error fetching system offers:', error);
    res.status(500).json({ error: 'Failed to fetch system offers' });
  }
};

// Get a single system offer by ID
exports.getSystemOfferById = async (req, res) => {
  try {
    const offer = await SystemOffer.findById(req.params.id).populate('createdByAdmin', 'name email');
    if (!offer) {
      return res.status(404).json({ error: 'System offer not found' });
    }
    res.json(offer);
  } catch (error) {
    console.error('Error fetching system offer:', error);
    res.status(500).json({ error: 'Failed to fetch system offer' });
  }
};

// Delete a system offer by ID
exports.deleteSystemOffer = async (req, res) => {
  try {
    const deleted = await SystemOffer.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'System offer not found' });
    }
    res.json({ message: 'System offer deleted successfully' });
  } catch (error) {
    console.error('Error deleting system offer:', error);
    res.status(500).json({ error: 'Failed to delete system offer' });
  }
};
