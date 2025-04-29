<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Food Ordering & Delivery Platform - README</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: auto; padding: 2rem;">

  <h1>🍽️ Cloud-Native Food Ordering & Delivery Platform</h1>
  <p>A full-stack MERN microservices-based platform inspired by systems like <strong>PickMe Food</strong> and <strong>UberEats</strong>. The platform allows customers to browse restaurants, order food, track deliveries, and make secure payments. It features multiple microservices communicating via REST APIs, orchestrated using Docker.</p>

  <h2>🚀 Tech Stack</h2>
  <ul>
    <li><strong>Frontend:</strong> React.js</li>
    <li><strong>Backend Services:</strong> Node.js, Express.js</li>
    <li><strong>Database:</strong> MongoDB</li>
    <li><strong>Authentication:</strong> JWT + Role-based Access Control</li>
    <li><strong>Containerization:</strong> Docker</li>
    <li><strong>Other Integrations:</strong> Cloudinary (images), PayHere (payment), Twilio/SMTP (notifications)</li>
  </ul>

  <h2>🧩 Microservices Architecture</h2>
  <table border="1" cellpadding="8" cellspacing="0">
    <thead>
      <tr>
        <th>Service</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>admin-service</td><td>Manages admin operations like restaurant verification, user management.</td></tr>
      <tr><td>auth-service</td><td>Handles login, registration, and JWT-based authentication.</td></tr>
      <tr><td>restaurant-service</td><td>Allows restaurants to manage menus, availability, and orders.</td></tr>
      <tr><td>order-service</td><td>Manages customer orders and statuses.</td></tr>
      <tr><td>delivery-service</td><td>Assigns delivery personnel and updates delivery tracking.</td></tr>
      <tr><td>payment-service</td><td>Integrates third-party payment systems like PayHere.</td></tr>
      <tr><td>user-service</td><td>Manages customer profiles and order history.</td></tr>
      <tr><td>gateway-api</td><td>Acts as a unified API gateway for routing requests to appropriate services.</td></tr>
    </tbody>
  </table>

  <h2>🧑‍🍳 User Roles</h2>
  <ul>
    <li><strong>Customer:</strong> Browse restaurants, place orders, pay, and track delivery.</li>
    <li><strong>Restaurant Owner:</strong> Manage menus, orders, availability.</li>
    <li><strong>Admin:</strong> Approve restaurants, oversee the platform.</li>
    <li><strong>Delivery Personnel:</strong> Manage and complete delivery assignments.</li>
  </ul>

  <h2>📦 Project Structure</h2>
  <pre>
/Client               # React frontend
/Admin-Service
/Auth-Service
/Restaurant-Service
/Order-Service
/Delivery-Service
/Payment-Service
/User-Service
/Gateway-API
/docker-compose.yml
  </pre>

  <h2>⚙️ How to Run (Local Deployment)</h2>
  <ol>
    <li><strong>Clone the repo</strong><br>
    </li>
    <li><strong>Start with Docker Compose</strong><br>
      <code>docker-compose up --build</code>
    </li>
    <li><strong>Access the app</strong><br>
      - Web client: <code>http://localhost:5173</code><br>
      - Gateway API: <code>http://localhost:&lt;gateway-port&gt;</code>
    </li>
  </ol>

  <h2>🔐 Security</h2>
  <ul>
    <li>JWT-based authentication</li>
    <li>Role-based access control (RBAC)</li>
    <li>Protected routes on frontend and backend</li>
  </ul>

  <h2>📧 Notifications</h2>
  <ul>
    <li>SMS via Twilio or similar</li>
    <li>Email confirmations using SMTP services</li>
  </ul>

  <h2>💳 Payment Integration</h2>
  <p>Secure payments via <strong>PayHere</strong> or <strong>Stripe</strong> (sandbox mode).</p>

  <h2>📸 Media</h2>
  <p>Images uploaded by restaurants and menu items are stored using <strong>Cloudinary</strong>.</p>

  

  <h2>👥 Team Members</h2>
  <pre>
    IT22066770 - Athukorala H.H.B 
    IT22070630 - Perera K.D.N 
    IT22220424 - Kaushalya P.L.P.D
    IT22187178 - Vijithapala T.G.K.G
  </pre>

  <h2>📄 Report</h2>
  <p>See <code>report.pdf</code> for:</p>
  <ul>
    <li>Architecture Diagram</li>
    <li>API Interface Specifications</li>
    <li>Workflow Descriptions</li>
    <li>Security Overview</li>
    <li>Individual Contributions</li>
  </ul>

  <h2>🧪 Testing</h2>
  <p>Each microservice can be tested individually using Postman or any REST client. Example endpoints:</p>
  <ul>
    <li><code>POST /auth/register</code></li>
    <li><code>GET /restaurant/menus</code></li>
    <li><code>POST /order/create</code></li>
  </ul>

  <h2>📌 Notes</h2>
  <ul>
    <li>Designed for scalability and modular development.</li>
    <li>Built using <strong>REST principles</strong> for interoperability and microservice flexibility.</li>
    <li>Easily portable to Kubernetes for production scaling.</li>
  </ul>

</body>
</html>
