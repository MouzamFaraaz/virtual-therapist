from llm_service import get_llm_response, kokoro_background_worker
import threading

def process_user_input(user_input):
    """
    Processes the user's input, gets a response from the chatbot, 
    and returns the response text immediately while playing speech asynchronously.
    """
    response_text = get_llm_response(user_input)  # Get AI response first

    # Play speech in a separate thread (so it doesn't block text display)
    threading.Thread(target=kokoro_background_worker, args=(response_text,), daemon=True).start()

    return response_text  # Send text response instantly
