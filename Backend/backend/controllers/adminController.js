const User = require('../models/userModel');
const mongoose = require('mongoose');

// Helper to check for valid ObjectId
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password field
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete a user by ID (admin only)
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Promote a user to admin (admin only)
exports.promoteToAdmin = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { isAdmin: true },
            { new: true, select: '-password' }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User promoted to admin', user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get chats of a user (admin only)
exports.getUserChats = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const user = await User.findById(userId).select('chats username email');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ chats: user.chats, username: user.username, email: user.email });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};