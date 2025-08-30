const express = require('express');
const cors = require('cors');
const connectDB = require('./models/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes'); // <-- Add this line
require('dotenv').config(); // Add this as the FIRST line

// ... rest of your code
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', chatRoutes); // <-- Add this line

// Root endpoint
app.get('/', (req, res) => {
    res.send('Virtual Therapist API is running');
});

// Connect to MongoDB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to database:', err);
});