const TRANSCRIPTION_SERVICE_URL = process.env.NEXT_PUBLIC_TRANSCRIPTION_SERVICE_URL || 'http://localhost:8000';

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence_score: number;
  speakers_detected: number;
  segments: TranscriptionSegment[];
  duration: number;
}

class TranscriptionClient {
  private baseUrl: string;

  constructor(baseUrl: string = TRANSCRIPTION_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  async transcribeFile(file: File): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    return response.json();
  }

  async transcribeFromUrl(url: string): Promise<TranscriptionResult> {
    const response = await fetch(`${this.baseUrl}/transcribe-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; model_loaded: boolean }> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const transcriptionClient = new TranscriptionClient();
