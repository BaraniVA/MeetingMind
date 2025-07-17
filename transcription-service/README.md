# Whisper Transcription Service

This service provides audio transcription capabilities using OpenAI's Whisper model.

## Features

- High-quality audio transcription
- Support for multiple audio formats
- Speaker detection
- Timestamp extraction
- RESTful API endpoints

## API Endpoints

### `GET /health`
Health check endpoint for monitoring.

### `POST /transcribe`
Transcribe an uploaded audio file.

**Request:** Multipart form data with audio file
**Response:** Transcription result with text, segments, and metadata

### `POST /transcribe-url`
Transcribe audio from a URL.

**Request:** JSON with `url` field
**Response:** Transcription result

## Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
uvicorn app:app --reload
```

The service will be available at `http://localhost:8000`

## Deployment

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Select the `transcription-service` folder as the build context
3. Railway will automatically detect the Dockerfile and deploy

### Environment Variables

No additional environment variables needed - the service works out of the box.

## Docker

Build and run locally:

```bash
docker build -t whisper-transcription .
docker run -p 8000:8000 whisper-transcription
```

## Model Information

- Default model: `base` (39 MB)
- Available models: `tiny`, `base`, `small`, `medium`, `large`
- Better models = higher accuracy but longer processing time

You can change the model in `app.py` by modifying the `whisper.load_model()` call.
