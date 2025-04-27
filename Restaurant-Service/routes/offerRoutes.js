const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const authenticateToken = require('../middleware/authMiddleware'); // Import the authenticateToken middleware

// CRUD routes
router.post('/', authenticateToken, offerController.createOffer); // Protect this route
router.get('/', offerController.getAllOffers);
router.get('/restaurant', offerController.getAllRestaurantOffers);
router.get('/restaurant/:restaurantId',authenticateToken ,offerController.getOffersByRestaurantId);
router.put("/:offerId",authenticateToken,offerController.editOffer);


module.exports = router;
