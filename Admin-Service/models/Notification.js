const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  recipients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin', // Assuming Admin is your model for admin users
      required: true
    }
  ],
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
