import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { transcriptionClient } from '@/lib/transcription-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioFileId } = body;

    if (!audioFileId) {
      return NextResponse.json(
        { error: 'Audio file ID is required' },
        { status: 400 }
      );
    }

    // Get audio file from database
    const { data: audioFile, error: fetchError } = await supabase
      .from('audio_files')
      .select('*')
      .eq('id', audioFileId)
      .single();

    if (fetchError || !audioFile) {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      );
    }

    // Update status to processing
    await supabase
      .from('audio_files')
      .update({ transcription_status: 'processing' })
      .eq('id', audioFileId);

    try {
      // Transcribe using our service
      const result = await transcriptionClient.transcribeFromUrl(audioFile.url);

      // Store transcript in database
      const { data: transcript, error: transcriptError } = await supabase
        .from('transcripts')
        .insert([
          {
            audio_id: audioFileId,
            text: result.text,
            language: result.language,
            confidence_score: result.confidence_score,
            speakers_detected: result.speakers_detected,
          }
        ])
        .select()
        .single();

      if (transcriptError) {
        throw new Error(`Failed to store transcript: ${transcriptError.message}`);
      }

      // Update audio file status to done
      await supabase
        .from('audio_files')
        .update({ 
          transcription_status: 'done',
          duration: result.duration 
        })
        .eq('id', audioFileId);

      // Generate AI summary (you can implement this later)
      // For now, create a basic summary
      const summary = generateBasicSummary(result.text);
      
      await supabase
        .from('summaries')
        .insert([
          {
            audio_id: audioFileId,
            text: summary.text,
            highlights: summary.highlights,
            todo: summary.todo,
            key_topics: summary.key_topics,
          }
        ]);

      return NextResponse.json({
        success: true,
        transcript: transcript,
        message: 'Transcription completed successfully'
      });

    } catch (transcriptionError) {
      // Update status to failed
      await supabase
        .from('audio_files')
        .update({ transcription_status: 'failed' })
        .eq('id', audioFileId);

      throw transcriptionError;
    }

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateBasicSummary(text: string) {
  // Basic summary generation - you can replace this with AI later
  const words = text.split(' ');
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return {
    text: sentences.slice(0, 3).join('. ') + '.',
    highlights: [
      `Meeting duration: ${Math.ceil(words.length / 150)} minutes (estimated)`,
      `Total words spoken: ${words.length}`,
      `Key discussion points identified`
    ],
    todo: [
      'Review meeting recording',
      'Follow up on action items',
      'Share summary with team'
    ],
    key_topics: extractKeyTopics(text)
  };
}

function extractKeyTopics(text: string): string[] {
  // Simple keyword extraction - replace with proper NLP later
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const words = text.toLowerCase().split(/\W+/);
  const wordFreq: { [key: string]: number } = {};

  words.forEach(word => {
    if (word.length > 4 && !commonWords.includes(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}
