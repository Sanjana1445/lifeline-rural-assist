import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, Mic, MicOff, Camera, Send } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Triage = () => {
  const [recording, setRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("english");
  const [useTTS, setUseTTS] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Initialize camera
  useEffect(() => {
    return () => {
      // Cleanup: stop camera stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      // Request camera permissions explicitly
      const constraints = { 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(err => {
          console.error('Video play error:', err);
          throw new Error('Failed to start video preview');
        });
        setCameraActive(true);
        
        toast({
          title: "Camera active",
          description: "Tap the center button to capture an image",
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access your camera. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context && videoRef.current.videoWidth) {
        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Draw the video frame to the canvas
        context.drawImage(videoRef.current, 0, 0);
        
        try {
          // Convert the canvas to a data URL and set as selected image
          const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
          setSelectedImage(dataUrl);
          
          // Stop the camera stream
          stopCamera();

          toast({
            title: "Image captured",
            description: "You can now add a voice message or submit the image for analysis",
          });
        } catch (e) {
          console.error('Error capturing image:', e);
          toast({
            title: "Error",
            description: "Failed to capture image. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!message.trim() && !selectedImage && !recording) {
      toast({
        title: "Input Required",
        description: "Please speak or upload an image to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Add user message to conversation history
    if (message.trim()) {
      setConversationHistory(prev => [...prev, {role: 'user', content: message}]);
    }
    
    try {
      // Send query to Gemini API through our edge function
      const response = await fetch(`${window.location.origin}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          image: selectedImage,
          language: detectedLanguage !== "english" ? detectedLanguage : undefined,
          history: conversationHistory
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Add AI response to conversation history
      setConversationHistory(prev => [...prev, {role: 'assistant', content: data.text}]);
      setMessage("");
      
      // If TTS is enabled, convert response to speech
      if (useTTS && data.text) {
        speakResponse(data.text);
      }
    } catch (error) {
      console.error('Error processing query:', error);
      toast({
        title: "Processing Error",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceRecording(audioBlob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly. Recording will stop automatically after 10 seconds.",
      });
      
      // Stop recording after 10 seconds automatically
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopVoiceRecording();
        }
      }, 10000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Unable to access your microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      toast({
        title: "Recording Stopped",
        description: "Processing your voice input...",
      });
    }
  };

  const processVoiceRecording = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert the audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        // Send to our voice-to-text function
        const response = await fetch(`${window.location.origin}/functions/v1/voice-to-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ audioData: base64Audio }),
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const transcript = data.transcript || '';
        const language = data.language?.toLowerCase() || 'english';
        
        setMessage(transcript);
        setDetectedLanguage(language);
        setUseTTS(true); // Enable TTS by default for voice queries
        
        // Automatically submit the query
        setTimeout(() => {
          handleSubmit();
        }, 100);
      };
    } catch (error) {
      console.error('Error processing voice recording:', error);
      toast({
        title: "Voice Processing Error",
        description: "There was an error processing your voice. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          toast({
            title: "Image Uploaded",
            description: "You can now add a voice message or submit the image for analysis",
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const speakResponse = async (text: string) => {
    try {
      // Send text to our text-to-speech function
      const response = await fetch(`${window.location.origin}/functions/v1/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text, 
          language: detectedLanguage 
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Play the audio
      if (audioRef.current && data.audioBase64) {
        const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
        audioRef.current.src = audioSrc;
        audioRef.current.play();
        setAudioPlaying(true);
        
        audioRef.current.onended = () => {
          setAudioPlaying(false);
        };
      }
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      toast({
        title: "Speech Error",
        description: "There was an error converting text to speech.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <div className="flex items-center mb-4">
          <Link to="/" className="mr-2">
            <ArrowLeft />
          </Link>
          <h1 className="text-xl font-bold">Triage & Symptom Checker</h1>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <p className="text-gray-600 mb-4">
            Take a photo or speak to describe your symptoms for AI analysis. Our system
            will help assess your condition and provide guidance.
          </p>

          {/* Camera View */}
          {cameraActive && (
            <div className="relative mb-4">
              <video 
                ref={videoRef} 
                className="w-full h-64 object-cover rounded-lg bg-black"
                autoPlay 
                playsInline
              />
              <button
                onClick={captureImage}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-3 shadow"
              >
                <div className="w-12 h-12 rounded-full border-2 border-gray-400"></div>
              </button>
            </div>
          )}

          {/* Canvas for capturing image */}
          <canvas ref={canvasRef} className="hidden"></canvas>
          <audio ref={audioRef} className="hidden"></audio>

          {/* Image Display/Upload Area */}
          {!cameraActive && (
            <div className="mb-4">
              {selectedImage ? (
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Uploaded"
                    className="w-full h-64 object-contain rounded-lg"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <ArrowLeft size={16} className="transform rotate-45" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={startCamera}
                  className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                >
                  <Camera size={48} className="mb-2 text-gray-400" />
                  <p className="text-center text-gray-500">
                    Tap to take a photo
                  </p>
                </button>
              )}

              {/* Upload Option */}
              <label className="mt-2 block text-center">
                <div className="inline-flex items-center text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  <Upload size={16} className="mr-1" /> Upload image instead
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          )}

          {/* Voice Input Button - Centered */}
          <div className="flex flex-col items-center mt-6 mb-4">
            <button
              type="button"
              onClick={toggleRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                recording ? "bg-red-500 text-white animate-pulse" : "bg-eresq-navy text-white"
              }`}
            >
              {recording ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <p className="mt-2 text-sm text-gray-600">
              {recording ? "Tap to stop recording" : "Tap to speak"}
            </p>
          </div>
          
          {/* Hidden submit button for form submission via Enter key */}
          <form onSubmit={handleSubmit} className="hidden">
            <button type="submit">Submit</button>
          </form>

          {/* Submit button for image analysis */}
          {selectedImage && (
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isProcessing}
              className={`w-full mt-4 bg-eresq-navy text-white p-3 rounded-lg hover:bg-opacity-90 flex items-center justify-center ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send size={16} />
                  <span>Analyze Image</span>
                </div>
              )}
            </Button>
          )}
        </div>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm mt-4">
            <h3 className="font-medium text-eresq-navy mb-2">Conversation:</h3>
            <div className="space-y-4">
              {conversationHistory.map((msg, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-50 ml-12' 
                      : 'bg-gray-50 mr-12'
                  }`}
                >
                  <p className="text-sm font-semibold mb-1">
                    {msg.role === 'user' ? 'You' : 'AI Assistant'}:
                  </p>
                  <p className="text-gray-700">{msg.content}</p>
                  
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => speakResponse(msg.content)}
                      disabled={audioPlaying}
                      className={`mt-2 text-xs flex items-center text-eresq-navy ${
                        audioPlaying ? 'opacity-50' : ''
                      }`}
                    >
                      {audioPlaying ? (
                        <span className="flex items-center">
                          <span className="w-3 h-3 relative flex justify-center mx-1">
                            <span className="w-0.5 h-2 bg-eresq-navy mx-px animate-waveform"></span>
                            <span className="w-0.5 h-3 bg-eresq-navy mx-px animate-waveform animation-delay-200"></span>
                            <span className="w-0.5 h-1.5 bg-eresq-navy mx-px animate-waveform animation-delay-500"></span>
                          </span>
                          Playing...
                        </span>
                      ) : (
                        <>
                          <Mic size={12} className="mr-1" /> Listen
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Speech button for last AI response */}
            {conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'assistant' && (
              <div className="flex justify-center mt-4">
                <Button
                  type="button"
                  onClick={() => speakResponse(conversationHistory[conversationHistory.length - 1].content)}
                  disabled={audioPlaying}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  {audioPlaying ? (
                    <>
                      <span className="w-4 relative flex justify-center">
                        <span className="w-0.5 h-2 bg-current mx-px animate-waveform"></span>
                        <span className="w-0.5 h-3 bg-current mx-px animate-waveform animation-delay-200"></span>
                        <span className="w-0.5 h-1.5 bg-current mx-px animate-waveform animation-delay-500"></span>
                      </span>
                      <span>Playing audio...</span>
                    </>
                  ) : (
                    <>
                      <Mic size={16} />
                      <span>Listen to response</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNavBar />
      
      <style>
        {`
        @keyframes waveform {
          0% { height: 3px; }
          50% { height: 12px; }
          100% { height: 3px; }
        }
        .animate-waveform {
          animation: waveform 1s ease-in-out infinite;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        `}
      </style>
    </div>
  );
};

export default Triage;
