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
# Load conversation history from db.json
def load_conversation_history():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as file:
            try:
                return json.load(file)
            except json.JSONDecodeError:
                return []  # Return empty list if the file is empty or invalid
    return []  # Return empty list if the file doesn't exist

# Save updated conversation history to db.json
def save_conversation_history(history):
    with open(DB_FILE, "w") as file:
        json.dump(history, file, indent=4)

# Initialize conversation history
conversation_history = load_conversation_history()

# 🎯 **Kokoro Background Thread Setup**
kokoro_pipeline = KPipeline(lang_code="a")  # 'a' = American English
speech_queue = queue.Queue()  # Queue to manage speech requests

def kokoro_background_worker():
    """Continuously checks the queue and speaks responses using Kokoro."""
    while True:
        text = speech_queue.get()  # Wait for new text to process
        if text == "STOP":  
            break  # Graceful exit when needed

        generator = kokoro_pipeline(text, voice="af_heart", speed=1, split_pattern=r"\n+")
        for _, _, audio_data in generator:
            sd.play(audio_data, samplerate=24000)
            sd.wait()

# Start Kokoro's speaking thread
kokoro_thread = threading.Thread(target=kokoro_background_worker, daemon=True)
kokoro_thread.start()

# 🎯 **Therapist AI Prompt**
THERAPIST_PROMPT = f"""[ROLE]  
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
7. **Don't give suggestions in points (e.g., 1. 2.), just give 9-10 line responses and make sure they are empathetic**
8. **Remember the history from {conversation_history} and recall events from it when discussed about them**
"""

# 🎯 **Generate LLM Response via API**
def get_llm_response(user_input):
    # Add user input to conversation history
    conversation_history.append({"role": "user", "content": user_input})
    
    # Prepare the prompt using conversation history
    prompt = THERAPIST_PROMPT + "\n" + "User: " + user_input
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
            stream=False,
            max_tokens=200,
            temperature=0.7,
            top_p=0.8
        )
        response = chat_completion.choices[0].message.content.strip()

        # Add assistant response to conversation history
        conversation_history.append({"role": "assistant", "content": response})
        
        # Save updated conversation history
        save_conversation_history(conversation_history)
        
        # Kokoro logic
        speech_queue.put(response)

        # Return the response so it can be printed to the console as well
        return response
    except Exception as e:
        print(f"❌ Groq API Error: {e}")
        return "Sorry, I couldn't generate a response at this moment."


