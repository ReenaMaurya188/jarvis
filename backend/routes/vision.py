import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import google.generativeai as genai
from PIL import Image
import io

router = APIRouter()

api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "your_gemini_api_key":
    genai.configure(api_key=api_key)

@router.post("/")
async def analyze_image(file: UploadFile = File(...), prompt: str = Form("Describe this image in detail.")):
    if not api_key or api_key == "your_gemini_api_key":
        raise HTTPException(status_code=500, detail="Gemini API key is not configured.")

    try:
        # Read the image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Use Gemini Flash
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content([prompt, image])
        
        return {"description": response.text}
    except Exception as e:
        print(f"Error in vision module: {e}")
        raise HTTPException(status_code=500, detail=str(e))
