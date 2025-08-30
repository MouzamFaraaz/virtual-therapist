import threading
import queue
import requests
import sounddevice as sd
import os
import json
from kokoro import KPipeline
from groq import Groq

# Set environment variable
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=API_KEY)

# Path to your JSON file
DB_FILE = "db.json"

# 🎯 **Conversation History Management**
def load_conversation_history():
    """Load conversation history from db.json"""
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as file:
            try:
                return json.load(file)
            except json.JSONDecodeError:
                return []  # Return empty list if the file is empty or invalid
    return []  # Return empty list if the file doesn't exist

def save_conversation_history(history):
    """Save updated conversation history to db.json"""
    with open(DB_FILE, "w") as file:
        json.dump(history, file, indent=4)

# Initialize conversation history
conversation_history = load_conversation_history()

# 🎯 **Kokoro Background Thread Setup**
kokoro_pipeline = KPipeline(lang_code="a")  # 'a' = American English
speech_queue = queue.Queue()  # Queue to manage speech requests

def kokoro_background_worker(stop_event):
    """
    Continuously checks the queue and speaks responses using Kokoro.
    Args:
        stop_event: threading.Event to signal when to stop
    """
    while not stop_event.is_set():
        try:
            text = speech_queue.get(timeout=1)  # Wait for new text with timeout
            if text == "STOP":
                break  # Graceful exit when needed

            generator = kokoro_pipeline(text, voice="af_heart", speed=1, split_pattern=r"\n+")
            for _, _, audio_data in generator:
                sd.play(audio_data, samplerate=24000)
                sd.wait()
        except queue.Empty:
            continue  # Continue checking if queue is empty

# Create stop event and start Kokoro's speaking thread
stop_event = threading.Event()
kokoro_thread = threading.Thread(target=kokoro_background_worker, args=(stop_event,), daemon=True)
kokoro_thread.start()

# 🎯 **Therapist AI Prompt**
THERAPIST_PROMPT = """[ROLE]  
You are a **compassionate AI therapist**, deeply knowledgeable in psychology, emotional well-being, and human behavior.  
Your purpose is to **genuinely support** the user by providing empathetic, thoughtful, and personalized guidance.  
[PERSONALITY]  
- **Warm, understanding, and deeply empathetic**  
- Communicates **naturally**, like a real therapist  
- Offers **gentle, flowing responses** (never robotic or overly structured)  
- **Adapts tone** based on the user's emotional state—calm and serious when needed, light and encouraging when appropriate  
[INSTRUCTIONS]  
1. **If the user greets you, respond warmly and engage naturally.**  
2. **If the user shares deep emotions, acknowledge and validate their feelings before offering insight.**  
3. **Make responses feel organic and immersive, like a real conversation.**  
4. **Avoid structured lists—keep the dialogue smooth and human-like.**  
5. **Stay mindful of previous interactions to avoid repetition.**  
6. **Avoid recommending hotlines or emergency services, instead help the user overcome their fears and recommend them songs to cheer them up**
7. **Don't give suggestions in points (e.g., 1. 2.), just give 9-10 line responses and make sure they are empathetic"""
# Removed history reference from prompt to reduce token usage

def get_llm_response(user_input):
    """Generate response from LLM and manage conversation history"""
    global conversation_history
    
    # Add user input to conversation history
    conversation_history.append({"role": "user", "content": user_input})
    
    # Limit conversation history to reduce token usage
    MAX_HISTORY_LENGTH = 3  # Reduced from 5 to 3 to prevent API errors
    trimmed_history = conversation_history[-MAX_HISTORY_LENGTH:]
    
    # Prepare messages for API - more efficient format
    messages = [
        {"role": "system", "content": THERAPIST_PROMPT},
        *[{"role": entry["role"], "content": entry["content"]} for entry in trimmed_history]
    ]
    
    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama3-70b-8192",
            stream=False,
            max_tokens=150,  # Reduced from 200 to prevent API errors
            temperature=0.7,
            top_p=0.8
        )
        response = chat_completion.choices[0].message.content.strip()

        # Add assistant response to conversation history
        conversation_history.append({"role": "assistant", "content": response})
        
        # Save updated conversation history
        save_conversation_history(conversation_history)
        
        # Queue the response for Kokoro
        speech_queue.put(response)

        return response
    except Exception as e:
        print(f"❌ Groq API Error: {e}")
        error_msg = "Sorry, I encountered an issue generating a response. Could you try rephrasing or shortening your message?"
        return error_msg

def cleanup():
    """Clean up resources before shutdown"""
    stop_event.set()
    speech_queue.put("STOP")
    kokoro_thread.join(timeout=1)

# Example usage in a Flask app would look like:
"""
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message', '')
    response = get_llm_response(user_input)
    return jsonify({'response': response})

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000)
    finally:
        cleanup()
"""