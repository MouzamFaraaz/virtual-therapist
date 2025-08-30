// Frontend JavaScript for saving chats - Seraphis Chat System
// Function to save chat to database
async function saveChat(userMessage, botReply) {
    try {
        const response = await fetch('http://localhost:5000/api/chats/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                userMessage: userMessage,
                botReply: botReply
            })
        });
        const result = await response.json();
        
        if (response.ok) {
            console.log('Chat saved successfully:', result.message);
            return result;
        } else {
            console.error('Error saving chat:', result.message);
            return null;
        }
    } catch (error) {
        console.error('Network error saving chat:', error);
        return null;
    }
}

// Function to load user's chat history
async function loadChatHistory() {
    try {
        const response = await fetch('http://localhost:5000/api/chats', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        const result = await response.json();
        
        if (response.ok) {
            console.log('Chat history loaded:', result);
            return result.chats;
        } else {
            console.error('Error loading chats:', result.message);
            return [];
        }
    } catch (error) {
        console.error('Network error loading chats:', error);
        return [];
    }
}

// Mock function to simulate AI response (replace with your actual AI integration)
async function getBotResponse(userInput) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock responses - replace this with actual AI API call
    const responses = [
        "I understand how you're feeling. Can you tell me more about what's been on your mind?",
        "That sounds challenging. How has this been affecting your daily life?",
        "Thank you for sharing that with me. What would you like to explore further?",
        "I hear you. Let's work through this together. What do you think might help?",
        "Those feelings are completely valid. How long have you been experiencing this?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// Function to display messages in chat
function displayMessage(message, sender) {
    const chatContainer = document.querySelector('.space-y-4.mb-6');
    if (!chatContainer) {
        console.error('Chat container not found');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'flex justify-end' : 'flex justify-start';
    
    const messageContent = document.createElement('div');
    messageContent.className = sender === 'user' 
        ? 'bg-gray-100 rounded-2xl rounded-tr-none px-4 py-3 max-w-xs'
        : 'bg-blue-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs';
    
    const messageText = document.createElement('p');
    messageText.className = 'text-gray-800';
    messageText.textContent = message;
    
    messageContent.appendChild(messageText);
    messageDiv.appendChild(messageContent);
    chatContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to handle chat submission
async function handleChatSubmission(userInput) {
    if (!userInput.trim()) return;
    
    // 1. Display user message in chat
    displayMessage(userInput, 'user');
    
    // 2. Show typing indicator (optional)
    const typingDiv = document.createElement('div');
    typingDiv.className = 'flex justify-start typing-indicator';
    typingDiv.innerHTML = `
        <div class="bg-blue-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs">
            <p class="text-gray-800">Seraphis is typing...</p>
        </div>
    `;
    const chatContainer = document.querySelector('.space-y-4.mb-6');
    chatContainer.appendChild(typingDiv);
    
    try {
        // 3. Get bot response 
        const botResponse = await getBotResponse(userInput);
        
        // Remove typing indicator
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        // 4. Display bot response in chat
        displayMessage(botResponse, 'bot');
        
        // 5. Save the conversation to database
        await saveChat(userInput, botResponse);
        
    } catch (error) {
        // Remove typing indicator on error
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        displayMessage("I'm sorry, I'm having trouble responding right now. Please try again.", 'bot');
        console.error('Error getting bot response:', error);
    }
}

// Function to initialize chat functionality
function initializeChatInterface() {
    // Clear existing demo messages
    const chatContainer = document.querySelector('.space-y-4.mb-6');
    if (chatContainer) {
        chatContainer.innerHTML = '';
    }
    
    // Add welcome message
    displayMessage("Hello! I'm Seraphis, your personal AI therapist. How are you feeling today?", 'bot');
    
    // Set up input handling
    const chatButton = document.querySelector('button[class*="w-full rounded-full"]');
    if (chatButton) {
        let isListening = false;
        
        chatButton.onclick = function() {
            if (!isListening) {
                // Start voice input or show text input
                showTextInput();
            }
        };
    }
}

// Function to show text input modal/prompt
function showTextInput() {
    const userInput = prompt("Type your message to Seraphis:");
    if (userInput && userInput.trim()) {
        handleChatSubmission(userInput.trim());
    }
}

// Function to display chat history on page load
async function initializeChatHistory() {
    try {
        const chatHistory = await loadChatHistory();
        
        if (chatHistory && chatHistory.length > 0) {
            // Clear welcome message if we have history
            const chatContainer = document.querySelector('.space-y-4.mb-6');
            if (chatContainer) {
                chatContainer.innerHTML = '';
            }
            
            chatHistory.forEach(chat => {
                displayMessage(chat.user_message || chat.userMessage, 'user');
                displayMessage(chat.bot_reply || chat.botReply, 'bot');
            });
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
        // Continue with fresh session
        initializeChatInterface();
    }
}

// Enhanced startTherapy function
function startTherapy() {
    // If we're already on the main page with chat interface
    if (document.querySelector('.space-y-4.mb-6')) {
        initializeChatInterface();
        initializeChatHistory();
    } else {
        // Navigate to chatbot page
        window.location.href = "chatbot.html";
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a page with chat interface
    if (document.querySelector('.space-y-4.mb-6')) {
        initializeChatHistory();
    }
});

// Export functions for use in HTML
window.startTherapy = startTherapy;
window.handleChatSubmission = handleChatSubmission;