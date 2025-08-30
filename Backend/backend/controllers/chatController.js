const User = require('../models/userModel');

// Save a chat message and bot reply
exports.saveChat = async (req, res) => {
    try {
        const { userMessage, botReply } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!userMessage || !botReply) {
            return res.status(400).json({ message: 'User message and bot reply are required' });
        }

        // Find user and add chat to their chats array
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add new chat to user's chats array
        user.chats.push({
            user: userMessage,
            bot: botReply,
            timestamp: new Date()
        });

        // Save to database
        await user.save();

        res.status(200).json({ 
            message: 'Chat saved successfully',
            chatId: user.chats[user.chats.length - 1]._id
        });

    } catch (error) {
        console.error('Error saving chat:', error);
        res.status(500).json({ message: 'Server error while saving chat' });
    }
};

// Get all chats for the current user
exports.getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId).select('chats username');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            username: user.username,
            chats: user.chats
        });

    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: 'Server error while fetching chats' });
    }
};

// Delete a specific chat
exports.deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove chat from user's chats array
        user.chats = user.chats.filter(chat => chat._id.toString() !== chatId);
        await user.save();

        res.status(200).json({ message: 'Chat deleted successfully' });

    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ message: 'Server error while deleting chat' });
    }
};