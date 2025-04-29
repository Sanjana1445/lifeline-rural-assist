
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, Mic, MicOff, Camera, Send } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Triage = () => {
  const [query, setQuery] = useState("");
  const [recording, setRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("english");
  const [useTTS, setUseTTS] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access your camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Draw the video frame to the canvas
        context.drawImage(videoRef.current, 0, 0);
        
        // Convert the canvas to a data URL and set as selected image
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setSelectedImage(dataUrl);
        
        // Stop the camera stream
        stopCamera();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !selectedImage) {
      toast({
        title: "Input Required",
        description: "Please enter a query or upload an image.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setMessage("Processing your query...");
    
    try {
      // Send query to Gemini API through our edge function
      const response = await fetch(`${window.location.origin}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: query,
          image: selectedImage,
          language: detectedLanguage !== "english" ? detectedLanguage : undefined
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setMessage(data.text);
      
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
      setMessage("Sorry, there was an error processing your request. Please try again.");
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
      const mediaRecorder = new MediaRecorder(stream);
      
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
        
        setQuery(transcript);
        setDetectedLanguage(language);
        setUseTTS(true); // Enable TTS by default for voice queries
        
        // Automatically submit the query
        setTimeout(() => {
          handleSubmit(new Event('submit') as unknown as React.FormEvent);
        }, 100);
      };
    } catch (error) {
      console.error('Error processing voice recording:', error);
      toast({
        title: "Voice Processing Error",
        description: "There was an error processing your voice. Please try text input.",
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
      
      // In a real implementation, we would play the audio
      if (audioRef.current && data.audioUrl) {
        audioRef.current.src = data.audioUrl;
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

          {/* Query Input */}
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={recording ? "Listening..." : "Ask about symptoms or medication..."}
                className={`w-full p-3 border ${
                  recording ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } rounded-lg pr-12`}
                disabled={recording}
              />
              <button
                type="button"
                onClick={toggleRecording}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
                  recording ? "bg-red-100 text-red-600" : "text-gray-400"
                }`}
              >
                {recording ? (
                  <MicOff size={20} className="animate-pulse" />
                ) : (
                  <Mic size={20} />
                )}
              </button>
            </div>
            <div className="flex items-center mt-2 space-x-2">
              <button
                type="submit"
                disabled={isProcessing || recording}
                className={`flex-1 bg-eresq-navy text-white p-3 rounded-lg hover:bg-opacity-90 flex items-center justify-center ${
                  (isProcessing || recording) ? 'opacity-50 cursor-not-allowed' : ''
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
                    <span>Get Help</span>
                  </div>
                )}
              </button>

              {message && (
                <button
                  type="button"
                  onClick={() => speakResponse(message)}
                  disabled={audioPlaying}
                  className={`bg-eresq-navy text-white p-3 rounded-lg aspect-square ${
                    audioPlaying ? 'opacity-50' : 'hover:bg-opacity-90'
                  }`}
                >
                  {audioPlaying ? (
                    <div className="w-5 h-5 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1 h-3 bg-white mx-0.5 animate-waveform"></div>
                        <div className="w-1 h-4 bg-white mx-0.5 animate-waveform animation-delay-200"></div>
                        <div className="w-1 h-2 bg-white mx-0.5 animate-waveform animation-delay-500"></div>
                      </div>
                    </div>
                  ) : (
                    <Mic size={20} />
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {message && (
          <div className="bg-white rounded-lg p-4 shadow-sm mt-4">
            <h3 className="font-medium text-eresq-navy mb-2">AI Assessment:</h3>
            <p className="text-gray-700">{message}</p>
          </div>
        )}
      </div>
      <BottomNavBar />
      
      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default Triage;
