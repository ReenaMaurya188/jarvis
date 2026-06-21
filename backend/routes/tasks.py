from fastapi import APIRouter
from pydantic import BaseModel
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta

router = APIRouter()

# Initialize APScheduler
scheduler = BackgroundScheduler()
scheduler.start()

# In-memory store for v1
reminders = []

class ReminderRequest(BaseModel):
    message: str
    delay_seconds: int

def trigger_reminder(message: str):
    # In a real app, this would push a notification or save to DB for the frontend to poll.
    # For now, we'll just log it.
    print(f"[REMINDER TRIGGERED] {message}")
    reminders.append({"time": datetime.now().isoformat(), "message": message, "status": "triggered"})

def schedule_reminder(message: str, delay_seconds: int):
    run_date = datetime.now() + timedelta(seconds=delay_seconds)
    scheduler.add_job(trigger_reminder, 'date', run_date=run_date, args=[message])
    
    reminders.append({"time": run_date.isoformat(), "message": message, "status": "pending"})
    return f"Reminder set for {delay_seconds} seconds from now."

@router.post("/")
def create_reminder(request: ReminderRequest):
    return {"status": schedule_reminder(request.message, request.delay_seconds)}

@router.get("/")
def get_reminders():
    return {"reminders": reminders}
