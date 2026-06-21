import psutil
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging
from routes import chat, search, code, tasks, vision

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="JARVIS Backend")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/system-stats")
def get_system_stats():
    # Fetch real CPU and RAM using psutil
    cpu_percent = psutil.cpu_percent(interval=None) # Non-blocking
    ram = psutil.virtual_memory()
    return {
        "cpu": cpu_percent,
        "ram": ram.percent,
        "ram_used_gb": round(ram.used / (1024**3), 1),
        "ram_total_gb": round(ram.total / (1024**3), 1)
    }

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(code.router, prefix="/code", tags=["code"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(vision.router, prefix="/vision", tags=["vision"])


@app.get("/")
def root():
    return {"status": "JARVIS-lite API is running"}

@app.get("/stats")
def get_stats():
    cpu_percent = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    return {
        "cpu": cpu_percent,
        "ram_used_gb": round(memory.used / (1024**3), 1),
        "ram_total_gb": round(memory.total / (1024**3), 1),
        "ram_percent": memory.percent
    }
