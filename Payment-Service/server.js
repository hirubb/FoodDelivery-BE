// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_URI = process.env.MONGODB_URI;

// Import routes
const paymentRoutes = require('./routes/paymentRoutes');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Welcome route
app.get('/', (req, res) => {
  res.send('Payment Service API');
});

// Mount routes
app.use('/api/payments', paymentRoutes);

// Success and cancel routes for PayHere returns
app.get('/payment/success', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Payment Successful</title>
        <script>
          // Inform parent window about success
          window.onload = function() {
            if (window.opener) {
              window.opener.postMessage({ status: 'success', orderId: '${req.query.order_id || ''}' }, '*');
              setTimeout(() => window.close(), 2000);
            } else {
              window.location.href = '/'; // Redirect to home if not opened as popup
            }
          };
        </script>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
          .success { color: green; font-size: 24px; }
          .message { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="success">Payment Successful!</div>
        <div class="message">Your order has been confirmed. This window will close automatically.</div>
      </body>
    </html>
  `);
});

app.get('/payment/cancel', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Payment Cancelled</title>
        <script>
          // Inform parent window about cancellation
          window.onload = function() {
            if (window.opener) {
              window.opener.postMessage({ status: 'cancelled', orderId: '${req.query.order_id || ''}' }, '*');
              setTimeout(() => window.close(), 2000);
            } else {
              window.location.href = '/'; // Redirect to home if not opened as popup
            }
          };
        </script>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
          .cancelled { color: #f44336; font-size: 24px; }
          .message { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="cancelled">Payment Cancelled</div>
        <div class="message">Your payment was cancelled. This window will close automatically.</div>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Connect to MongoDB
mongoose
  .connect(DB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Payment service running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });