const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

// Save a new chat (user message + bot reply)
router.post('/chats/save', authenticate, chatController.saveChat);

// Get all chats for the current user
router.get('/chats', authenticate, chatController.getUserChats);

// Delete a specific chat
router.delete('/chats/:chatId', authenticate, chatController.deleteChat);

module.exports = router;