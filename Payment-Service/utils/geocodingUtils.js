// utils/geocodingUtils.js
const axios = require('axios');
require('dotenv').config();

/**
 * Convert address to geographic coordinates using Google Maps Geocoding API
 * @param {String} address - Street address
 * @param {String} city - City name
 * @param {String} country - Country name
 * @param {String} postalCode - Postal/ZIP code (optional)
 * @returns {Object|null} - Object containing latitude and longitude, or null if geocoding failed
 */
const geocodeAddress = async (address, city, country, postalCode) => {
  try {
    if (!address && !postalCode) {
      console.warn('No address or postal code provided for geocoding');
      return null;
    }

    // Combine address components, filtering out empty values
    const addressComponents = [
      address,
      city || '',
      postalCode || '',
      country || 'Sri Lanka'
    ].filter(Boolean);
    
    const fullAddress = addressComponents.join(', ');
    
    // URL encode the address
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Make sure we have an API key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.error('Missing or invalid Google Maps API key');
      return null;
    }
    
    // Make request to Google Maps Geocoding API
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    );

    // Check if request was successful and has results
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      
      console.log(`📍 Geocoded address "${fullAddress}" to: ${lat}, ${lng}`);
      
      return {
        latitude: lat,
        longitude: lng
      };
    } else {
      console.warn(`Geocoding failed for address: ${fullAddress}`, response.data.status);
      
      // If we get ZERO_RESULTS, try with just city and country
      if (response.data.status === 'ZERO_RESULTS' && city) {
        console.log('Trying geocoding with just city and country...');
        const fallbackAddress = [city, country || 'Sri Lanka'].filter(Boolean).join(', ');
        const fallbackEncodedAddress = encodeURIComponent(fallbackAddress);
        
        const fallbackResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${fallbackEncodedAddress}&key=${apiKey}`
        );
        
        if (fallbackResponse.data.status === 'OK' && fallbackResponse.data.results.length > 0) {
          const { lat, lng } = fallbackResponse.data.results[0].geometry.location;
          console.log(`📍 Geocoded fallback address "${fallbackAddress}" to: ${lat}, ${lng}`);
          return {
            latitude: lat,
            longitude: lng
          };
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address:', error.message);
    return null;
  }
};

module.exports = {
  geocodeAddress
};