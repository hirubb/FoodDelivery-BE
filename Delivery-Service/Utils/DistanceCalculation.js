const haversineDistance = (lat1, lon1, lat2, lon2) => {
    // Validate the inputs to check if they are valid numbers
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        console.error(`Invalid input coordinates: lat1 = ${lat1}, lon1 = ${lon1}, lat2 = ${lat2}, lon2 = ${lon2}`);
        return NaN;  // Return NaN if any of the coordinates are invalid
    }

    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180); // Convert degrees to radians
    const dLon = (lon2 - lon1) * (Math.PI / 180); // Convert degrees to radians

    // Haversine formula
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Result in kilometers

    console.log(`Calculated distance: ${distance} km`);
    return distance;
};

module.exports = haversineDistance;
