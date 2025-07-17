'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  MessageSquare, 
  Calendar, 
  Download, 
  Share,
  Clock,
  User,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TranscriptionViewProps {
  file: any;
  onClose: () => void;
}

export function TranscriptionView({ file, onClose }: TranscriptionViewProps) {
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<any[]>([]);
  const [transcript, setTranscript] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [askingQuestion, setAskingQuestion] = useState(false);

  useEffect(() => {
    fetchTranscriptionData();
  }, [file.id]);

  const fetchTranscriptionData = async () => {
    try {
      // Fetch transcript
      const { data: transcriptData } = await supabase
        .from('transcripts')
        .select('*')
        .eq('audio_id', file.id)
        .single();

      // Fetch summary
      const { data: summaryData } = await supabase
        .from('summaries')
        .select('*')
        .eq('audio_id', file.id)
        .single();

      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('audio_id', file.id);

      // Fetch Q&A history
      const { data: qaData } = await supabase
        .from('qa_logs')
        .select('*')
        .eq('audio_id', file.id)
        .order('created_at', { ascending: true });

      setTranscript(transcriptData);
      setSummary(summaryData);
      setEvents(eventsData || []);
      setQaHistory(qaData || []);
    } catch (error) {
      console.error('Error fetching transcription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setAskingQuestion(true);
    try {
      // Simulate AI response (replace with actual AI integration)
      const simulatedAnswer = "Based on the meeting transcript, I can provide you with relevant information. This is a simulated AI response that would analyze the content and provide accurate answers.";

      const { data, error } = await supabase
        .from('qa_logs')
        .insert([
          {
            audio_id: file.id,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            question,
            answer: simulatedAnswer,
            confidence_score: 0.85
          }
        ])
        .select()
        .single();

      if (!error && data) {
        setQaHistory(prev => [...prev, data]);
      }
      setQuestion('');
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setAskingQuestion(false);
    }
  };

  const mockTranscript = transcript?.text || `
[00:00] Speaker 1: Good morning everyone, thanks for joining our Q1 planning meeting.

[00:15] Speaker 2: Thanks for having us. I wanted to start by reviewing our progress from last quarter.

[00:32] Speaker 1: Absolutely. We achieved 95% of our targets, which is fantastic. The marketing campaign performed exceptionally well.

[00:45] Speaker 3: I agree. The ROI on our digital marketing spend was 340%, which exceeded our expectations by 40%.

[01:02] Speaker 1: That's excellent. For Q1, I think we should focus on three key areas: expanding our product line, improving customer retention, and optimizing our sales funnel.

[01:20] Speaker 2: I'd like to add that we should also consider investing in AI tools to improve our transcription and meeting analysis capabilities.

[01:35] Speaker 3: Great point. I've been researching some solutions that could help us automatically generate meeting summaries and extract action items.
  `;

  const mockSummary = summary || {
    text: "This Q1 planning meeting covered the team's exceptional Q4 performance with 95% target achievement and 340% ROI on digital marketing. The discussion focused on three key priorities for Q1: product line expansion, customer retention improvement, and sales funnel optimization. The team also explored investing in AI tools for meeting transcription and analysis.",
    highlights: [
      "Achieved 95% of Q4 targets",
      "Digital marketing ROI reached 340%",
      "Q1 focus: product expansion, retention, sales optimization",
      "Exploring AI tools for meeting analysis"
    ],
    todo: [
      "Complete quarterly report by Friday",
      "Schedule follow-up meeting with client",
      "Review budget allocations for Q2",
      "Research AI transcription solutions"
    ]
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>{file.name}</span>
            <Badge className={file.transcription_status === 'done' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}>
              {file.transcription_status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="flex h-full space-x-6">
            {/* Main Content */}
            <div className="flex-1">
              <Tabs defaultValue="transcript" className="h-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="qa">Q&A</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                </TabsList>

                <TabsContent value="transcript" className="h-[calc(100%-40px)]">
                  <Card className="h-full hover-lift">
                    <CardHeader>
                      <CardTitle>Full Transcript</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Duration: {Math.floor(file.duration / 60)}:{(file.duration % 60).toString().padStart(2, '0')}
                        </span>
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {transcript?.speakers_detected || 3} Speakers
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-120px)]">
                      <ScrollArea className="h-full">
                        <div className="space-y-4 text-sm">
                          {mockTranscript.split('\n').filter((line: string) => line.trim()).map((line, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              {line}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="summary" className="h-[calc(100%-40px)]">
                  <div className="space-y-4 h-full">
                    <Card className="hover-lift">
                      <CardHeader>
                        <CardTitle>AI Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 leading-relaxed">{mockSummary.text}</p>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="hover-lift">
                        <CardHeader>
                          <CardTitle className="text-lg">Key Highlights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {mockSummary.highlights.map((highlight: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <span className="text-sm">{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="hover-lift">
                        <CardHeader>
                          <CardTitle className="text-lg">Action Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {mockSummary.todo.map((item: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                <span className="text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="qa" className="h-[calc(100%-40px)]">
                  <Card className="h-full flex flex-col hover-lift">
                    <CardHeader>
                      <CardTitle>Ask Questions</CardTitle>
                      <CardDescription>
                        Ask AI anything about this meeting
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <ScrollArea className="flex-1 mb-4">
                        <div className="space-y-4">
                          {qaHistory.map((qa, index) => (
                            <div key={index} className="space-y-2 animate-fade-in">
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="text-sm font-medium text-blue-900">Q: {qa.question}</p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-700">A: {qa.answer}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(qa.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Ask a question about this meeting..."
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !askingQuestion && handleAskQuestion()}
                          disabled={askingQuestion}
                        />
                        <Button onClick={handleAskQuestion} disabled={askingQuestion || !question.trim()}>
                          {askingQuestion ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="events" className="h-[calc(100%-40px)]">
                  <Card className="h-full hover-lift">
                    <CardHeader>
                      <CardTitle>Extracted Events</CardTitle>
                      <CardDescription>
                        AI-detected meetings and deadlines
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {events.length === 0 ? (
                          <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No events detected in this meeting.</p>
                          </div>
                        ) : (
                          events.map((event, index) => (
                            <div key={index} className="p-4 border rounded-lg hover-lift">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {new Date(event.start_time).toLocaleString()}
                                  </p>
                                  <p className="text-sm text-gray-500">{event.location}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {event.added_to_google_calendar ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Added
                                    </Badge>
                                  ) : (
                                    <Button size="sm" variant="outline" className="transition-all hover:scale-[1.02]">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      Add to Calendar
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Action Panel */}
            <div className="w-64 space-y-4">
              <Card className="hover-lift">
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start transition-all hover:scale-[1.02]">
                    <Download className="w-4 h-4 mr-2" />
                    Export Transcript
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start transition-all hover:scale-[1.02]">
                    <Share className="w-4 h-4 mr-2" />
                    Share Summary
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start transition-all hover:scale-[1.02]">
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Events
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader>
                  <CardTitle className="text-lg">File Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span>{Math.floor(file.duration / 60)}:{(file.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className="text-xs">{file.transcription_status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}