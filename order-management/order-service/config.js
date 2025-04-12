require("dotenv").config();

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL,
};
