'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  Upload, 
  FileAudio, 
  Clock, 
  MessageSquare, 
  Calendar,
  MoreHorizontal,
  Play,
  Pause,
  Download,
  User,
  Settings,
  LogOut
} from 'lucide-react';

import { AudioUpload } from '@/components/dashboard/audio-upload';
import { TranscriptionView } from '@/components/dashboard/transcription-view';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

interface AudioFile {
  id: string;
  name: string;
  duration: number;
  transcription_status: 'pending' | 'processing' | 'done' | 'failed';
  created_at: string;
  progress?: number;
}

export default function HomePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchAudioFiles();
    }
  }, [user]);

  const fetchAudioFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audio files:', error);
      } else {
        setAudioFiles(data || []);
      }
    } catch (error) {
      console.error('Error fetching audio files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('audio_files')
        .insert([
          {
            user_id: user.id,
            name: file.name,
            url: publicUrl,
            duration: 0,
            file_size: file.size,
            mime_type: file.type,
            transcription_status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating audio file record:', error);
        return;
      }

      setAudioFiles(prev => [data, ...prev]);

      // Start transcription process
      try {
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ audioFileId: data.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to start transcription');
        }

        // Refresh the audio files to get updated status
        fetchAudioFiles();
      } catch (transcriptionError) {
        console.error('Error starting transcription:', transcriptionError);
        // Update the file status to failed in the UI
        setAudioFiles(prev => 
          prev.map(f => 
            f.id === data.id 
              ? { ...f, transcription_status: 'failed' as const }
              : f
          )
        );
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Meeting Transcriptions</h1>
                  <p className="text-gray-600">Upload, transcribe, and analyze your meetings with AI</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.email}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <AudioUpload onUpload={handleFileUpload} />
              
              <Card className="group hover:shadow-lg transition-all duration-300 border-dashed border-2 border-gray-300 hover:border-red-400 cursor-pointer animate-slide-up hover-lift">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                    <Mic className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Record Meeting</h3>
                  <p className="text-gray-600 text-sm mb-4">Start recording directly from your browser</p>
                  <Button variant="outline" className="w-full transition-all hover:scale-[1.02]">
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Files */}
            <Card className="animate-slide-up hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileAudio className="w-5 h-5 mr-2" />
                  Recent Meetings
                </CardTitle>
                <CardDescription>
                  Your uploaded and recorded meetings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {audioFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileAudio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No meetings yet. Upload your first audio file to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {audioFiles.map((file, index) => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer animate-fade-in hover-lift"
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => setSelectedFile(file)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileAudio className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{file.name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(file.duration)}</span>
                              <span>•</span>
                              <span>{new Date(file.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getStatusColor(file.transcription_status)} border`}>
                            {file.transcription_status}
                          </Badge>
                          
                          {file.transcription_status === 'processing' && file.progress && (
                            <div className="w-24">
                              <Progress value={file.progress} className="h-2" />
                            </div>
                          )}
                          
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        
      </div>

      {/* Transcription Modal/View */}
      {selectedFile && (
        <TranscriptionView 
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}