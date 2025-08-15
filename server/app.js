const express = require('express');
const cors = require('cors');
const roomRoutes = require('./routes/roomRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/rooms', roomRoutes); // Removed trailing slash for consistency

// Health check
app.get('/', (req, res) => res.send('CollabBoard Backend'));

module.exports = app;
