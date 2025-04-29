
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, Mic, MicOff, Camera, Send } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

const Triage = () => {
  const [recording, setRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("english");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [waitingForVoiceInput, setWaitingForVoiceInput] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  // Scroll to bottom of chat when conversation history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  // Cleanup function for progress interval
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Cleanup camera stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      // Request camera permissions explicitly with proper constraints
      const constraints = { 
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } 
      };
      
      console.log("Requesting camera access with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          setCameraActive(true);
          
          toast({
            title: "Camera active",
            description: "Tap the center button to capture an image",
          });
        } catch (playError) {
          console.error('Video play error:', playError);
          throw new Error('Failed to start video preview');
        }
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
            description: "You can now add a voice message or speak to analyze the image",
          });
          
          // Start voice recording to ask about the image
          setWaitingForVoiceInput(true);
          
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

  const toggleRecording = async () => {
    if (recording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
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
    setWaitingForVoiceInput(false);
    
    // Start progress animation
    setProcessingProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = window.setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 95) {
          clearInterval(progressIntervalRef.current!);
          return 95;
        }
        return newProgress;
      });
    }, 300);
    
    try {
      // Convert the audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      
      // Send to our voice-to-text function
      const response = await fetch(`${window.location.origin}/functions/v1/voice-to-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioData: base64Audio }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Voice-to-text API error: ${response.status} ${errorText}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Invalid response from voice-to-text service");
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const transcript = data.transcript || '';
      const language = data.language?.toLowerCase() || 'english';
      
      setDetectedLanguage(language);
      
      // Add user message to conversation
      setConversationHistory(prev => [
        ...prev, 
        { role: 'user', content: transcript }
      ]);
      
      // Process with Gemini
      await sendToGemini(transcript);
      
    } catch (error) {
      console.error('Error processing voice recording:', error);
      toast({
        title: "Voice Processing Error",
        description: "There was an error processing your voice. Please try again.",
        variant: "destructive",
      });
      
      // Add fallback user message to conversation if processing failed but we have conversation history
      if (conversationHistory.length > 0) {
        await sendToGemini("I'm having trouble explaining my symptoms. Can you help guide me through some common questions?");
      }
    } finally {
      setIsProcessing(false);
      
      // Ensure progress is reset
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        setProcessingProgress(100);
      }
    }
  };

  const sendToGemini = async (message: string) => {
    try {
      // Send to Gemini API through our edge function
      const response = await fetch(`${window.location.origin}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          image: selectedImage,
          language: detectedLanguage !== "english" ? detectedLanguage : undefined,
          history: conversationHistory,
          context: "You are a medical AI assistant helping with symptom triage. Analyze the user's symptoms carefully and provide helpful guidance. For images, identify visible medical conditions or symptoms. Suggest next steps based on severity."
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errorText}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Invalid response from Gemini service");
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Add AI response to conversation
      setConversationHistory(prev => [
        ...prev, 
        { role: 'assistant', content: data.text }
      ]);
      
      // Speak the response
      speakResponse(data.text);
      
    } catch (error) {
      console.error('Error processing query:', error);
      
      // Add fallback AI response if the Gemini API call fails
      const fallbackMessage = "I'm sorry, I'm having trouble processing your request right now. Could you please try again or describe your symptoms differently?";
      
      setConversationHistory(prev => [
        ...prev, 
        { role: 'assistant', content: fallbackMessage }
      ]);
      
      speakResponse(fallbackMessage);
      
      toast({
        title: "Processing Error",
        description: "There was an error analyzing your input. Please try again.",
        variant: "destructive",
      });
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
            description: "You can now speak to analyze the image",
          });
          
          // Prompt for voice input
          setWaitingForVoiceInput(true);
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
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Text-to-speech API error: ${response.status} ${errorText}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Invalid response from text-to-speech service");
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Play the audio
      if (audioRef.current && data.audioBase64) {
        const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
        audioRef.current.src = audioSrc;
        
        try {
          await audioRef.current.play();
          setAudioPlaying(true);
          
          audioRef.current.onended = () => {
            setAudioPlaying(false);
          };
        } catch (playError) {
          console.error("Error playing audio:", playError);
          setAudioPlaying(false);
        }
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

  const handleAddMoreDetails = () => {
    setWaitingForVoiceInput(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-24">
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
                muted // Add muted attribute to ensure autoplay works
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
            {isProcessing ? (
              <div className="w-full max-w-md space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                  <p>Processing your input...</p>
                </div>
                <Progress value={processingProgress} className="h-2" />
                <p className="text-sm text-center text-gray-500">Analyzing your voice and preparing response</p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={cameraActive}
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    recording ? "bg-red-500 text-white animate-pulse" : "bg-eresq-navy text-white"
                  } ${cameraActive ? "opacity-50" : ""}`}
                >
                  {recording ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <p className="mt-2 text-sm text-gray-600">
                  {waitingForVoiceInput 
                    ? "Please describe your symptoms or ask about the image" 
                    : recording 
                      ? "Tap to stop recording" 
                      : "Tap to speak"}
                </p>
                {waitingForVoiceInput && (
                  <div className="mt-2 text-xs text-blue-600 animate-pulse">
                    Waiting for your voice input...
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm mt-4">
            <h3 className="font-medium text-eresq-navy mb-2">Conversation:</h3>
            <div 
              ref={chatContainerRef}
              className="space-y-4 max-h-80 overflow-y-auto"
            >
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
              
              {audioPlaying && (
                <div className="flex justify-center my-2">
                  <div className="bg-blue-100 px-3 py-1 rounded-full flex items-center">
                    <span className="flex space-x-1 items-center">
                      <span className="w-1 h-2 bg-blue-500 animate-waveform rounded-sm"></span>
                      <span className="w-1 h-4 bg-blue-500 animate-waveform animation-delay-200 rounded-sm"></span>
                      <span className="w-1 h-3 bg-blue-500 animate-waveform animation-delay-500 rounded-sm"></span>
                    </span>
                    <span className="ml-2 text-xs text-blue-700">Playing audio...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Button to add more details */}
            {conversationHistory.length > 0 && !isProcessing && !recording && (
              <div className="flex justify-center mt-4">
                <Button
                  type="button"
                  onClick={handleAddMoreDetails}
                  className="flex items-center space-x-2"
                  variant="outline"
                >
                  <Mic size={16} />
                  <span>Add more details</span>
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
