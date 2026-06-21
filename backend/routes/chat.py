from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import tempfile
import os
import json
from services.llm import client as groq_client
from services.db import save_message, get_recent_messages, get_message_count, search_memories, save_memory
from services.embeddings import get_embedding
from datetime import datetime
from tools_registry import GROQ_TOOLS
from routes.search import perform_search
from routes.code import run_python_code
from routes.tasks import schedule_reminder

router = APIRouter()

class ChatRequest(BaseModel):
    session_id: str
    message: str
    active_model: str = "jarvis"

def summarize_and_store_memory(session_id: str, recent_messages: list):
    convo_text = "\n".join([f"{m['role']}: {m['content']}" for m in recent_messages])
    messages = [
        {"role": "system", "content": "Summarize the key facts, user preferences, and important information from the following conversation into a single concise sentence. Only include facts worth remembering for the future."},
        {"role": "user", "content": convo_text}
    ]
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages
        )
        summary = response.choices[0].message.content
        if summary and len(summary) > 10:
            embedding = get_embedding(summary)
            if embedding:
                save_memory(session_id, summary, embedding)
    except Exception as e:
        print(f"Error summarizing memory: {e}")

def execute_tool(tool_call):
    function_name = tool_call.function.name
    arguments = json.loads(tool_call.function.arguments)
    
    if function_name == "web_search":
        result = perform_search(arguments.get("query"))
    elif function_name == "run_code":
        result = run_python_code(arguments.get("code"))
    elif function_name == "set_reminder":
        result = schedule_reminder(arguments.get("message"), arguments.get("delay_seconds"))
    else:
        result = f"Unknown tool: {function_name}"
        
    return json.dumps(result)

@router.post("/")
async def chat_endpoint(request: ChatRequest):
    # 1. Embed user message and retrieve memories
    query_embedding = get_embedding(request.message)
    memories = []
    if query_embedding:
        memories = search_memories(request.session_id, query_embedding, limit=5)
    
    # Format memories
    memory_context = ""
    if memories:
        memory_context = "\n\nRelevant memories from past conversations:\n" + "\n".join([f"- {m['content']}" for m in memories])

    # Model awareness
    model_awareness = ""
    if request.active_model == "engine":
        model_awareness = "\n[SYSTEM ALERT]: The user is currently looking at a 3D hologram of a V8 Car Engine. You can see it too. If they ask about components, refer to automotive engine mechanics."
    elif request.active_model == "pc":
        model_awareness = "\n[SYSTEM ALERT]: The user is currently looking at an exploded 3D hologram of a Gaming PC (Motherboard, GPU, RAM, Cooling). You can see it too. Answer questions contextually."
    else:
        model_awareness = "\n[SYSTEM ALERT]: The user is currently looking directly at your AI Core hologram (JARVIS Core)."

    # 2. Build system prompt
    current_time = datetime.now().strftime("%A, %B %d, %Y %I:%M %p")
    system_prompt = f"""You are JARVIS, a calm, concise, and slightly witty British AI assistant.
The current date and time is: {current_time}. You have access to real-time information.
You control a 3D holographic interface. If the user asks to see a specific 3D model, you MUST append a hidden command to the very end of your response exactly like this:
[CMD: swap_engine] - To load the V8 Engine
[CMD: swap_pc] - To load the Gaming PC
[CMD: swap_jarvis] - To load the JARVIS Core
{model_awareness}
{memory_context}"""
    
    # 3. Retrieve recent conversation history
    db_messages = get_recent_messages(request.session_id, limit=10)
    messages = [{"role": "system", "content": system_prompt}]
    
    for msg in db_messages:
        # Simple format for Groq
        messages.append({"role": msg["role"], "content": msg["content"]})
    
    messages.append({"role": "user", "content": request.message})

    # Save user message to DB
    save_message(request.session_id, "user", request.message)

    # 4. Call Groq with tools
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=GROQ_TOOLS,
            tool_choice="auto"
        )
        response_msg = response.choices[0].message
        tool_used = False
        
        # 5. Handle tool calls
        if response_msg.tool_calls:
            tool_used = True
            messages.append(response_msg) # Append assistant's tool call request
            
            for tool_call in response_msg.tool_calls:
                tool_result = execute_tool(tool_call)
                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": tool_call.function.name,
                    "content": tool_result,
                })
            
            # Second call to get final response
            second_response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages
            )
            final_reply = second_response.choices[0].message.content
        else:
            final_reply = response_msg.content or ""
            
        # Save assistant final response to DB
        save_message(request.session_id, "assistant", final_reply)
        
        # Check if we should summarize
        msg_count = get_message_count(request.session_id)
        if msg_count > 0 and msg_count % 10 == 0:
            recent_for_summary = get_recent_messages(request.session_id, limit=10)
            summarize_and_store_memory(request.session_id, recent_for_summary)
            
        return {
            "reply": final_reply,
            "tool_used": tool_used
        }
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return {
            "reply": "I am currently offline or experiencing a connection issue.",
            "tool_used": False
        }

@router.post("/audio")
async def transcribe_audio(audio: UploadFile = File(...)):
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            content = await audio.read()
            temp_audio.write(content)
            temp_audio.flush()
            
            # Send to Groq Whisper
            with open(temp_audio.name, "rb") as file:
                transcription = groq_client.audio.transcriptions.create(
                    file=(audio.filename or "audio.webm", file.read()),
                    model="whisper-large-v3"
                )
            
            # Clean up temp file
            os.remove(temp_audio.name)
            
            return {"text": transcription.text}
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return {"text": "", "error": str(e)}
