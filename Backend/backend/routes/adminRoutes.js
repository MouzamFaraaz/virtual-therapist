const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Get all users (admin only)
router.get('/users', authenticate, isAdmin, adminController.getAllUsers);

// Delete a user by ID (admin only)
router.delete('/users/:id', authenticate, isAdmin, adminController.deleteUser);

// Promote a user to admin (admin only)
router.patch('/users/:id/promote', authenticate, isAdmin, adminController.promoteToAdmin);

// Get chats of a user (admin only)
router.get('/users/:id/chats', authenticate, isAdmin, adminController.getUserChats);

module.exports = router;