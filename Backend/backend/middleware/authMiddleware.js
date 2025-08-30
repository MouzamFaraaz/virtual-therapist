const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Add this import

// Middleware to verify JWT token and attach user info to req.user
exports.authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        
        // Option 1: Use JWT payload directly (current approach - keep if it works)
        req.user = {
            id: decoded.id || decoded._id,
            isAdmin: decoded.isAdmin,
            email: decoded.email,
            username: decoded.username
        };
        
        /* Option 2: Fetch fresh user data from database (more secure)
        const user = await User.findById(decoded.id || decoded._id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        req.user = user;
        */
        
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        return res.status(403).json({ message: 'Admin access required' });
    }
};