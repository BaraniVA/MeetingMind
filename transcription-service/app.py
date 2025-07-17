from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import whisper
import tempfile
import os
import json
from typing import Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Whisper Transcription Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model on startup
model = None

@app.on_event("startup")
async def load_model():
    global model
    logger.info("Loading Whisper model...")
    model = whisper.load_model("base")  # You can use "small", "medium", "large" for better accuracy
    logger.info("Whisper model loaded successfully!")

@app.get("/")
async def root():
    return {"message": "Whisper Transcription Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as tmp_file:
            contents = await file.read()
            tmp_file.write(contents)
            tmp_file_path = tmp_file.name
        
        logger.info(f"Transcribing file: {file.filename}")
        
        # Transcribe with Whisper
        result = model.transcribe(tmp_file_path)
        
        # Clean up temporary file
        os.unlink(tmp_file_path)
        
        # Extract segments with timestamps
        segments = []
        for segment in result.get("segments", []):
            segments.append({
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"].strip(),
                "confidence": segment.get("avg_logprob", 0)
            })
        
        # Count speakers (simplified - just count unique speaker patterns)
        speakers_detected = len(set([seg["text"].split(":")[0] for seg in segments if ":" in seg["text"]]))
        if speakers_detected == 0:
            speakers_detected = 1
        
        response = {
            "text": result["text"],
            "language": result["language"],
            "confidence_score": result.get("avg_logprob", 0),
            "speakers_detected": speakers_detected,
            "segments": segments,
            "duration": len(segments) * 2 if segments else 0  # Rough estimation
        }
        
        logger.info(f"Transcription completed successfully for {file.filename}")
        return response
        
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        # Clean up temporary file if it exists
        if 'tmp_file_path' in locals():
            try:
                os.unlink(tmp_file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/transcribe-url")
async def transcribe_from_url(data: Dict[str, Any]):
    """Transcribe audio from a URL"""
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    url = data.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    try:
        logger.info(f"Transcribing from URL: {url}")
        
        # Download and transcribe
        result = model.transcribe(url)
        
        # Extract segments with timestamps
        segments = []
        for segment in result.get("segments", []):
            segments.append({
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"].strip(),
                "confidence": segment.get("avg_logprob", 0)
            })
        
        # Count speakers
        speakers_detected = len(set([seg["text"].split(":")[0] for seg in segments if ":" in seg["text"]]))
        if speakers_detected == 0:
            speakers_detected = 1
        
        response = {
            "text": result["text"],
            "language": result["language"],
            "confidence_score": result.get("avg_logprob", 0),
            "speakers_detected": speakers_detected,
            "segments": segments,
            "duration": len(segments) * 2 if segments else 0
        }
        
        logger.info("URL transcription completed successfully")
        return response
        
    except Exception as e:
        logger.error(f"URL transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
