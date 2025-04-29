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
  async function (accessToken, refreshToken, profile, done) {
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

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const services = [
    { name: "Admin", url: "http://localhost:4001/api/admin" },
    { name: "RestaurantOwner", url: "http://localhost:4000/api/restaurant-owners" },
    // { name: "DeliveryPerson", url: "http://localhost:3001/api/delivery-persons" },
    { name: "Customer", url: "http://localhost:9000/api/customers" }
  ];

  try {
    // Use Promise.allSettled to handle individual service errors
    const results = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await axios.get(service.url);
          console.log(`🔍 Response from ${service.name}:`, response.data);

          let users = [];

          // Handle different response structures
          if (service.name === "DeliveryPerson" && response.data.drivers) {
            // Extract user data from driver objects
            console.log("🚚 DeliveryPerson response:", response.data.drivers);
            users = response.data.drivers
              .filter(driver => driver.user) // Ensure user exists
              .map(driver => ({
                ...driver.user, // Spread the user data
                _id: driver._id, // Use the driver ID
                role: "DeliveryPerson" // Add role
              }));
          }
          // Handle standard user response format
          else if (Array.isArray(response.data.users)) {
            users = response.data.users;
          }
          // Handle single user format
          else if (response.data.user) {
            users = [response.data.user];
          }

          return users.map(user => ({
            ...user,
            role: user.role || service.name // Preserve existing role or use service name
          }));
        } catch (error) {
          console.error(`Error fetching from ${service.name} service:`, error.message);
          return []; // Return empty array on error
        }
      })
    );

    // Flatten all user results into a single array
    const allUsers = results.flatMap(result => result.value); // Correctly access the value array
    console.log("🔍 All users retrieved:", allUsers); // Log the full array of users

    // Find user by email
    const user = allUsers.find(user => {
      console.log("🔍 Checking user:", user); // Log each user to see their structure
      return user.email.toLowerCase() === email.toLowerCase(); // Case-insensitive email comparison
    });

    console.log("🔍 User found:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Token expires in 8 hours
    );

    // Return successful login response
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        first_name: user.first_name || user.firstName, // Handle different field names
        last_name: user.last_name || user.lastName,
        email: user.email,
        role: user.role
      },
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Authentication service error" });
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
