const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    user: String, // user's message
    bot: String,  // bot's reply
    timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin:  { type: Boolean, default: false },
    chats:    { type: [chatSchema], default: [] } // This is where chats are stored
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);