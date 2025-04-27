const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto"); // Added for secure password generation

// Configure dotenv to load environment variables
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGO_URI;

// Add at the top of server.js
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Session middleware - must be configured before Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
console.log("Callback URL:", `${process.env.BASE_URL}/api/auth/google/callback`);

// Configure Google Strategy
// In server.js, modify the GoogleStrategy implementation:

// In your GoogleStrategy implementation in server.js

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
async function(accessToken, refreshToken, profile, done) {
  try {
    // If no email, authentication fails
    if (!profile.emails || !profile.emails[0].value) {
      return done(new Error('No email found in Google profile'), null);
    }

    const userEmail = profile.emails[0].value;
    
    try {
      // First check if customer exists in the database
      const customer = await mongoose.connection.db.collection('customers').findOne({ email: userEmail });
      
      if (customer) {
        // Customer exists, return customer data
        return done(null, { 
          id: customer._id,
          email: customer.email, 
          role: "Customer",
          first_name: customer.first_name || profile.displayName.split(' ')[0],
          last_name: customer.last_name || profile.displayName.split(' ').slice(1).join(' '),
          googleId: profile.id
        });
      }
      
      // Customer doesn't exist, create a new one directly in the database
      const newCustomer = {
        email: userEmail,
        first_name: profile.name?.givenName || profile.displayName.split(' ')[0],
        last_name: profile.name?.familyName || profile.displayName.split(' ').slice(1).join(' '),
        password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10), // Hash the password
        role: "Customer",
        googleId: profile.id,
        username: profile.name?.givenName || profile.displayName.split(' ')[0],
        phone: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      };
      
      // Insert the new customer directly into the database
      const result = await mongoose.connection.db.collection('customers').insertOne(newCustomer);
      
      if (result.insertedId) {
        return done(null, {
          id: result.insertedId,
          email: newCustomer.email,
          role: "Customer",
          first_name: newCustomer.first_name,
          last_name: newCustomer.last_name,
          googleId: profile.id
        });
      } else {
        return done(new Error('Failed to create customer account'), null);
      }
    } catch (error) {
      console.error("Database error:", error.message);
      return done(error, null);
    }
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true // Allow cookies to be sent with requests
}));
app.use(bodyParser.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Sample route
app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

// Regular login endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const services = [
    { name: "Admin", url: "http://localhost:4001/api/admin" },
    { name: "RestaurantOwner", url: "http://localhost:4000/api/restaurant-owners"},
    // { name: "DeliveryPerson", url: "http://localhost:3001/api/delivery-persons" },
    { name: "Customer", url: "http://localhost:9000/api/customers" }
  ];

  try {
    // Use Promise.allSettled to handle individual service errors
    const results = await Promise.allSettled(
      services.map(async (service) => {
        const response = await axios.get(service.url);
        return {
          users: response.data.users,
          role: service.name,
        };
      })
    );

    // Filter out failed service results
    const validResults = results
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);

    // Search for the user in all available results
    for (let result of validResults) {
      const user = result.users.find((u) => u.email === email);
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          const token = jwt.sign(
            {
              id: user._id,
              role: user.role,
            },
            process.env.JWT_SECRET
          );

          return res.status(200).json({
            message: "Login successful",
            token,
            user: {
              id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role,
            },
          });
        } else {
          return res.status(401).json({ message: "Invalid password" });
        }
      }
    }

    return res.status(404).json({ message: "User not found" });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Google OAuth routes
app.get("/api/auth/google", 
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth routes
// In server.js, modify the Google callback handler:

app.get("/api/auth/google/callback", 
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err) {
        console.error("OAuth Error:", err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(err.message)}`);
      }
      
      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
      }
      
      // Check if the user is a customer - only allow customers
      if (user.role !== "Customer") {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_for_customers_only`);
      }
      
      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          // Add temporary flag if applicable
          temporary: user.temporary || false
        },
        process.env.JWT_SECRET
      );
      
      // Create more comprehensive response data
      const redirectUrl = `${process.env.CLIENT_URL}/google-callback?` + 
        `token=${token}&` +
        `userId=${user.id}&` +
        `role=${user.role}&` +
        `email=${encodeURIComponent(user.email)}`;
      
      return res.redirect(redirectUrl);
    })(req, res, next);
  }
);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Auth service http://localhost:${PORT}`);
});