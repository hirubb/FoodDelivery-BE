// utils/geocode.js
const getCoordinates = async (address) => {
  const fetch = (await import("node-fetch")).default;
  const apiKey = "e15127b57c444622949e284ab1f1583e";
  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data?.results?.length > 0) {
    const { lat, lng } = data.results[0].geometry;
    return { latitude: lat, longitude: lng };
  } else {
    throw new Error("Unable to geocode address");
  }
};

module.exports = getCoordinates;
