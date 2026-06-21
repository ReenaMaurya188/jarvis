import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
# If API key is not set, we'll initialize with a dummy to avoid crash on startup,
# but it will fail on actual request if not valid.
client = Groq(api_key=api_key if api_key and api_key != "your_groq_api_key" else "dummy")

def get_chat_completion(messages, tools=None):
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=tools,
            tool_choice="auto" if tools else "none"
        )
        return response.choices[0].message
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return None
