from flask import Flask, request, jsonify
from chat_service import process_user_input
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow frontend connections

@app.route('/chat', methods=['POST'])
def chat():
    """
    API endpoint for handling chatbot interactions.
    """
    data = request.json
    user_input = data.get("message")

    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    response_text = process_user_input(user_input)

    return jsonify({"response": response_text, "spoken": True})  # Indicating speech was played

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)  # Ensuring Flask binds properly
