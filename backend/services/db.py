import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL", "")
key = os.getenv("SUPABASE_KEY", "")

# Initialize client only if we have keys
if url and key and url != "your_supabase_url":
    supabase: Client = create_client(url, key)
else:
    supabase = None

def save_message(session_id: str, role: str, content: str):
    if not supabase: return None
    try:
        data = {"session_id": session_id, "role": role, "content": content}
        result = supabase.table("messages").insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error saving message: {e}")
        return None

def get_recent_messages(session_id: str, limit: int = 10):
    if not supabase: return []
    try:
        result = supabase.table("messages").select("*").eq("session_id", session_id).order("created_at", desc=True).limit(limit).execute()
        return list(reversed(result.data))
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return []

def get_message_count(session_id: str) -> int:
    if not supabase: return 0
    try:
        result = supabase.table("messages").select("id", count="exact").eq("session_id", session_id).execute()
        return result.count or 0
    except Exception as e:
        return 0

def save_memory(session_id: str, content: str, embedding: list):
    if not supabase: return None
    try:
        data = {"session_id": session_id, "content": content, "embedding": embedding}
        result = supabase.table("memories").insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error saving memory: {e}")
        return None

def search_memories(session_id: str, query_embedding: list, limit: int = 5):
    if not supabase: return []
    try:
        result = supabase.rpc(
            "match_memories",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.1,
                "match_count": limit,
                "p_session_id": session_id
            }
        ).execute()
        return result.data
    except Exception as e:
        print(f"Error searching memories: {e}")
        return []
