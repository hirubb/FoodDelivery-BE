const express = require('express');
const router = express.Router();
const systemOfferController = require('../controllers/SystemOfferController');
const authenticate  = require('../middleware/authMiddleware');

// POST /api/system-offers
router.post('/', authenticate ,systemOfferController.createSystemOffer);

// GET /api/system-offers
router.get('/', systemOfferController.getAllSystemOffers);

// GET /api/system-offers/:id
router.get('/:id', systemOfferController.getSystemOfferById);

// DELETE /api/system-offers/:id
router.delete('/:id', systemOfferController.deleteSystemOffer);

module.exports = router;
