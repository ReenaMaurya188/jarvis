# Mini-JARVIS

JARVIS-lite is a fullstack AI assistant with a chat/voice interface, a Python backend, and an LLM brain with memory, web search, code execution, vision, and tool-calling. It is built entirely on free-tier services.

## Features
- 🎙️ **Voice Interface**: Web Speech API for Speech-to-Text and Text-to-Speech.
- 🧠 **LLM Brain**: Groq API powered by `llama-3.3-70b-versatile`.
- 💾 **Long-term Memory**: Supabase pgvector and local Sentence Transformers.
- 🛠️ **Tool Calling**: Web search, sandboxed Python code execution, and reminders.
- 👁️ **Vision**: Image analysis using Google Gemini Flash.
- 🎛️ **HUD**: Live animated status tracker (Idle, Listening, Thinking, Speaking).

---

## Local Setup

### Prerequisites
1. **Groq API Key** (console.groq.com)
2. **Google Gemini API Key** (aistudio.google.com)
3. **Supabase Project URL & Key** (supabase.com)

### Database Setup
Run the following SQL in your Supabase SQL Editor:
```sql
create extension if not exists vector;

create table messages (
  id bigserial primary key,
  session_id text not null,
  role text not null,           
  content text not null,
  created_at timestamptz default now()
);

create table memories (
  id bigserial primary key,
  session_id text not null,
  content text not null,
  embedding vector(384),        
  created_at timestamptz default now()
);

create index on memories using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function match_memories (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  p_session_id text
)
returns table (id bigint, content text, similarity float)
language sql stable
as $$
  select memories.id, memories.content, 1 - (memories.embedding <=> query_embedding) as similarity
  from memories
  where memories.session_id = p_session_id
    and 1 - (memories.embedding <=> query_embedding) > match_threshold
  order by memories.embedding <=> query_embedding
  limit match_count;
$$;
```

### Backend Setup
1. `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and fill in your keys.
6. Run server: `uvicorn main:app --reload`

### Frontend Setup
1. `cd frontend`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

---

## Deployment Guide

### Backend (Render)
1. Push your code to GitHub.
2. Go to Render dashboard and create a new **Web Service**.
3. Connect your repository and select the `backend` directory as the Root Directory.
4. Environment: `Python`
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add your Environment Variables (`GROQ_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`).
8. Deploy (Free tier works perfectly since `sentence-transformers/all-MiniLM-L6-v2` only uses ~80MB RAM).

### Frontend (Vercel)
1. Go to Vercel dashboard and add a new Project.
2. Import the same repository.
3. Edit the Root Directory to `frontend`.
4. Framework Preset: `Vite`.
5. Add Environment Variable: `VITE_API_URL` pointing to your Render backend URL (e.g., `https://mini-jarvis-backend.onrender.com`).
6. Deploy!
