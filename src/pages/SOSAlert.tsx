
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle, CircleX, PhoneCall, Mic, MicOff, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

interface Responder {
  id: string;
  name: string;
  role: string;
  status: "pending" | "accepted";
  distance: string;
  phoneNumber: string;
}

type EmergencyStatus = "new" | "accepted" | "declined" | "cancelled";

const SOSAlert = () => {
  const [responders, setResponders] = useState<Responder[]>([]);
  const [alertSent, setAlertSent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState("");
  const [emergencyDescription, setEmergencyDescription] = useState("");
  const [showVoicePrompt, setShowVoicePrompt] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [textMessage, setTextMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("english");
  const [noSpeechTimeout, setNoSpeechTimeout] = useState<number | null>(null);
  const [waitingForVoiceInput, setWaitingForVoiceInput] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const progressIntervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Cleanup function for intervals and timers
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      if (noSpeechTimeout) {
        clearTimeout(noSpeechTimeout);
      }
    };
  }, [noSpeechTimeout]);

  useEffect(() => {
    if (showVoicePrompt) {
      // Auto-start recording when the voice prompt is shown
      startRecording();
    }
  }, [showVoicePrompt]);
  
  // Scroll to bottom of chat when conversation history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  useEffect(() => {
    // Load responders from supabase if available
    const fetchResponders = async () => {
      if (user && alertSent && emergencyId) {
        try {
          // Get emergency responses with responder profiles
          const { data, error } = await supabase
            .from('emergency_responses')
            .select(`
              id, 
              status,
              responder_id
            `)
            .eq('emergency_id', emergencyId);

          if (error) throw error;
          
          if (data && data.length > 0) {
            // Get responder profiles for all emergency responses
            const responderIds = data.map(item => item.responder_id);
            
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select(`
                id, 
                full_name, 
                frontline_type,
                phone
              `)
              .in('id', responderIds);
              
            if (profilesError) throw profilesError;
            
            if (profilesData && profilesData.length > 0) {
              // Get frontline types to map type IDs to names
              const { data: frontlineTypes, error: typesError } = await supabase
                .from('frontline_types')
                .select('*');
                
              if (typesError) throw typesError;
              
              const typeMap = frontlineTypes ? frontlineTypes.reduce((acc: Record<string, string>, type) => {
                acc[type.id] = type.name;
                return acc;
              }, {}) : {};
              
              // Transform the data to match our responders structure
              const transformedResponders = data.map(responseItem => {
                const profile = profilesData.find(p => p.id === responseItem.responder_id);
                
                if (!profile) return null;

                // Ensure status is one of the allowed types
                let typedStatus: "pending" | "accepted" = "pending";
                if (responseItem.status === "accepted") {
                  typedStatus = "accepted";
                }
                
                return {
                  id: responseItem.id,
                  name: profile.full_name || 'Unknown Responder',
                  role: profile.frontline_type && typeMap[profile.frontline_type] 
                    ? typeMap[profile.frontline_type] 
                    : 'Healthcare Worker',
                  status: typedStatus,
                  distance: "Calculating...", // This would come from a location service
                  phoneNumber: profile.phone || "+91 98765 43210",
                };
              }).filter(Boolean) as Responder[];
              
              setResponders(transformedResponders);
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching responders:', error);
        }
      }

      // Fallback to simulated data if there are issues or no real data
      if (alertSent) {
        setResponders([
          {
            id: "1",
            name: "Dr. Rajesh Kumar",
            role: "Medical Officer",
            status: "accepted",
            distance: "1.2 km",
            phoneNumber: "+91 98765 43210",
          },
          {
            id: "2",
            name: "Sunita Sharma",
            role: "ASHA Worker",
            status: "accepted",
            distance: "0.8 km",
            phoneNumber: "+91 87654 32109",
          },
          {
            id: "3",
            name: "Amit Singh",
            role: "ANM",
            status: "pending",
            distance: "2.5 km",
            phoneNumber: "+91 76543 21098",
          },
          {
            id: "4",
            name: "Dr. Priya Patel",
            role: "PHC Doctor",
            status: "pending",
            distance: "3.1 km",
            phoneNumber: "+91 65432 10987",
          },
        ]);
      }
    };

    fetchResponders();

    // Subscribe to emergency_responses changes to get real-time updates
    if (emergencyId) {
      const subscription = supabase
        .channel('emergency-responses-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'emergency_responses',
            filter: `emergency_id=eq.${emergencyId}`
          },
          () => {
            fetchResponders();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [alertSent, user, emergencyId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
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
        setAudioBlob(audioBlob);
        
        // Process the recording
        await processVoiceRecording(audioBlob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      
      // Set timeout for 5 seconds of no speech - automatically send emergency
      const timeout = window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log("No speech detected for 5 seconds, sending emergency alert automatically");
          stopRecording();
          
          // Send an automatic emergency alert
          setShowVoicePrompt(false);
          createEmergencyRecord("Emergency reported - No voice details provided").then(record => {
            if (record?.id) {
              setEmergencyId(record.id);
              notifyFrontlineWorkers(record.id);
            }
            setAlertSent(true);
            // Add a system message indicating the automatic alert
            setConversationHistory([
              {
                role: 'assistant', 
                content: "I've detected an emergency situation with no voice input. An alert has been sent automatically. Help is on the way. I'm here to assist you while help arrives. Can you type or try to speak to provide more information about your emergency?"
              }
            ]);
          });
        }
      }, 5000);
      
      setNoSpeechTimeout(timeout);
      
      // Stop recording after 15 seconds maximum (in case they do provide speech)
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 15000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Unable to access your microphone. Please check permissions and try again.",
        variant: "destructive",
      });
      
      // If mic access fails, allow user to skip voice input
      setShowVoicePrompt(false);
      setAlertSent(true);
      // Create a default emergency
      createEmergencyRecord("Medical emergency - No microphone access").then(record => {
        if (record?.id) {
          setEmergencyId(record.id);
          notifyFrontlineWorkers(record.id);
        }
      });
    }
  };

  const stopRecording = () => {
    // Clear the no-speech timeout
    if (noSpeechTimeout) {
      clearTimeout(noSpeechTimeout);
      setNoSpeechTimeout(null);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processVoiceRecording = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
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
      const base64Audio = await blobToBase64(audioBlob);
      
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
      setTranscription(transcript);
      console.log("Received transcript:", transcript);
      
      // Update the detected language
      const language = data.language?.toLowerCase() || "english";
      setDetectedLanguage(language);
      
      // Process the transcript with Gemini to extract emergency details
      const geminiResponse = await fetch(`${window.location.origin}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Extract a brief emergency description (less than 70 characters) from this transcript: "${transcript}". Only return the short description, nothing else.`,
          language: language
        }),
      });
      
      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error(`Gemini API error: ${geminiResponse.status} ${errorText}`);
      }
      
      let geminiData;
      try {
        geminiData = await geminiResponse.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Invalid response from Gemini service");
      }
      
      if (geminiData.error) throw new Error(geminiData.error);
      
      const shortDescription = geminiData.text.substring(0, 70) || "Medical emergency reported";
      setEmergencyDescription(shortDescription);
      console.log("Emergency description:", shortDescription);
      
      // Add user message to conversation history
      setConversationHistory(prev => [...prev, {
        role: 'user',
        content: transcript
      }]);
      
      // Hide voice prompt and show emergency screen
      setShowVoicePrompt(false);
      
      // Set progress to 100% to indicate completion
      setProcessingProgress(100);
      
      // Create emergency in database and notify frontline workers
      const emergencyRecord = await createEmergencyRecord(shortDescription || transcript);
      if (emergencyRecord?.id) {
        setEmergencyId(emergencyRecord.id);
        await notifyFrontlineWorkers(emergencyRecord.id);
      }
      
      setAlertSent(true);
      
      // Give emergency assistance tips
      await provideEmergencyGuidance(transcript);
      
    } catch (error) {
      console.error('Error processing voice recording:', error);
      toast({
        title: "Processing Error",
        description: "There was an error processing your voice recording. Please try again or skip voice input.",
        variant: "destructive",
      });
      
      // Still allow emergency to be sent despite error
      setShowVoicePrompt(false);
      // Create a default emergency
      const emergencyRecord = await createEmergencyRecord("Medical emergency reported");
      if (emergencyRecord?.id) {
        setEmergencyId(emergencyRecord.id);
        await notifyFrontlineWorkers(emergencyRecord.id);
      }
      setAlertSent(true);
      
      // Add a fallback conversation to ensure the AI provides some guidance
      setConversationHistory([
        {role: 'user', content: "I have a medical emergency"},
        {role: 'assistant', content: "I'll help you through this emergency. First, try to remain calm. Can you briefly tell me what's happening so I can provide specific guidance while help is on the way?"}
      ]);
      
      // Speak the assistant's response
      speakResponse("I'll help you through this emergency. First, try to remain calm. Can you briefly tell me what's happening so I can provide specific guidance while help is on the way?");
      
      // Set up for next voice input
      setWaitingForVoiceInput(true);
    } finally {
      setIsProcessing(false);
      // Ensure progress is reset
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const createEmergencyRecord = async (description: string) => {
    try {
      if (!user) {
        console.warn("No user logged in, using simulated emergency record");
        return { id: "simulated-emergency-id" };
      }
      
      const { data, error } = await supabase
        .from('emergencies')
        .insert({
          patient_id: user.id,
          description: description,
          location: "User location", // In a real app, this would be GPS coordinates
          status: "new" as EmergencyStatus
        })
        .select('id')
        .single();
      
      if (error) {
        console.error("Error creating emergency record:", error);
        throw error;
      }
      
      toast({
        title: "Emergency Created",
        description: "Your emergency has been recorded and help is on the way."
      });
      
      return data;
    } catch (error) {
      console.error("Failed to create emergency record:", error);
      return null;
    }
  };

  const notifyFrontlineWorkers = async (emergencyId: string) => {
    try {
      if (!emergencyId) return;
      
      // Get nearby frontline workers
      // In a real app, this would filter based on location, availability, etc.
      const { data: frontlineWorkers, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_frontline_worker', true)
        .limit(5);
      
      if (error) throw error;
      
      if (frontlineWorkers && frontlineWorkers.length > 0) {
        // Create emergency response records for each worker
        const responseRecords = frontlineWorkers.map(worker => ({
          emergency_id: emergencyId,
          responder_id: worker.id,
          status: 'pending'
        }));
        
        const { error: insertError } = await supabase
          .from('emergency_responses')
          .insert(responseRecords);
          
        if (insertError) throw insertError;
        
        toast({
          title: "Responders Notified",
          description: `${frontlineWorkers.length} frontline workers have been notified of your emergency.`
        });
        
        return frontlineWorkers.length;
      } else {
        toast({
          title: "No Responders Found",
          description: "We couldn't find any available frontline workers. Using simulated responders.",
        });
        return 0;
      }
    } catch (error) {
      console.error("Failed to notify frontline workers:", error);
      return 0;
    }
  };

  const provideEmergencyGuidance = async (transcript: string) => {
    try {
      // Get emergency guidance from Gemini
      const response = await fetch(`${window.location.origin}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Based on this emergency description: "${transcript}", provide brief, clear first aid or emergency instructions that the person should follow until medical help arrives. Keep it short, simple, and actionable.`,
          isEmergency: true,
          emergency_description: transcript,
          language: detectedLanguage
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
      
      if (data.error) throw new Error(data.error);
      
      // Add AI response to conversation history
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: data.text
      }]);
      
      // Convert to speech
      speakResponse(data.text);
      
      // Set waiting for voice input after AI speaks
      setWaitingForVoiceInput(true);
      
    } catch (error) {
      console.error('Error getting emergency guidance:', error);
      
      // Add fallback guidance if Gemini fails
      const fallbackGuidance = "Stay calm and try to relax. Help is on the way. If you're with someone experiencing an emergency, ensure they're in a safe position. Don't give them anything to eat or drink. Monitor their breathing and consciousness. I'll stay with you until help arrives.";
      
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: fallbackGuidance
      }]);
      
      speakResponse(fallbackGuidance);
      setWaitingForVoiceInput(true);
    }
  };
  
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textMessage.trim()) return;
    
    // Add user message to conversation history
    setConversationHistory(prev => [...prev, {
      role: 'user',
      content: textMessage
    }]);
    
    const userMessage = textMessage;
    setTextMessage('');
    
    try {
      const response = await fetch(`${window.location.origin}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage,
          history: conversationHistory,
          isEmergency: true,
          emergency_description: emergencyDescription,
          language: detectedLanguage
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
      
      if (data.error) throw new Error(data.error);
      
      // Add AI response to conversation history
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: data.text
      }]);
      
      // Convert to speech
      speakResponse(data.text);
      
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Add fallback response if API fails
      const fallbackResponse = "I'm sorry, I'm having trouble processing your request right now. Please focus on following the previous instructions while we wait for help to arrive.";
      
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: fallbackResponse
      }]);
      
      speakResponse(fallbackResponse);
      
      toast({
        title: "Chat Error",
        description: "There was an error processing your message. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to handle voice input continuation
  const handleVoiceInput = () => {
    if (waitingForVoiceInput && !recording && !isProcessing && !audioPlaying) {
      startVoiceRecording();
    }
  };

  const startVoiceRecording = async () => {
    // Clear the waiting state
    setWaitingForVoiceInput(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
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
        
        processConversationVoice(audioBlob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      
      // Stop recording after 10 seconds automatically
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopVoiceRecording();
        }
      }, 10000);
    } catch (error) {
      console.error('Error accessing microphone for conversation:', error);
      toast({
        title: "Microphone Error",
        description: "Unable to access your microphone for conversation. Please try text input instead.",
        variant: "destructive",
      });
      setWaitingForVoiceInput(false);
    }
  };
  
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const processConversationVoice = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    // Progress animation
    setProcessingProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = window.setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 95) {
          clearInterval(progressIntervalRef.current!);
          return 95;
        }
        return newProgress;
      });
    }, 200);
    
    try {
      // Convert the audio blob to base64
      const base64Audio = await blobToBase64(audioBlob);
      
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
      
      if (!transcript || transcript.trim().length === 0) {
        throw new Error("No speech detected");
      }
      
      // Add user message to conversation
      setConversationHistory(prev => [...prev, {
        role: 'user',
        content: transcript
      }]);
      
      // Use Gemini to respond
      await handleGeminiConversation(transcript);
      
    } catch (error) {
      console.error('Error processing voice for conversation:', error);
      toast({
        title: "Voice Processing Error",
        description: "There was an error understanding your voice. Please try again or use text input.",
        variant: "destructive",
      });
      
      // Re-enable voice input
      setWaitingForVoiceInput(true);
    } finally {
      setIsProcessing(false);
      
      // Ensure progress is reset
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        setProcessingProgress(100);
      }
    }
  };
  
  const handleGeminiConversation = async (message: string) => {
    try {
      // Call Gemini
      const response = await fetch(`${window.location.origin}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          history: conversationHistory,
          isEmergency: true,
          emergency_description: emergencyDescription,
          language: detectedLanguage
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
      
      if (data.error) throw new Error(data.error);
      
      // Add AI response to conversation history
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: data.text
      }]);
      
      // Speak the response
      speakResponse(data.text);
      
    } catch (error) {
      console.error('Error in conversation:', error);
      
      // Add fallback response
      const fallbackResponse = "I'm sorry, I couldn't process your message. While we wait for help, please try to stay calm and follow any medical instructions you've been given previously.";
      
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: fallbackResponse
      }]);
      
      speakResponse(fallbackResponse);
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
            // Automatically prompt for next voice input after audio finishes
            setWaitingForVoiceInput(true);
          };
        } catch (playError) {
          console.error("Error playing audio:", playError);
          setAudioPlaying(false);
          // If we can't play audio, still prompt for next input
          setWaitingForVoiceInput(true);
        }
      }
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      // Even if TTS fails, prompt for next input
      setWaitingForVoiceInput(true);
    }
  };

  const handleCancelEmergency = async () => {
    // Update emergency status in the database
    if (user && emergencyId) {
      try {
        const { error } = await supabase
          .from('emergencies')
          .update({ status: 'cancelled' as EmergencyStatus })
          .eq('id', emergencyId);
          
        if (error) throw error;
        
        toast({
          title: "Emergency Cancelled",
          description: "Your emergency request has been cancelled.",
        });
        navigate('/');
      } catch (error) {
        console.error('Error cancelling emergency:', error);
        toast({
          title: "Error",
          description: "Failed to cancel the emergency. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Emergency Cancelled",
        description: "Your emergency request has been cancelled.",
      });
      navigate('/');
    }
  };

  // Voice prompt overlay
  if (showVoicePrompt) {
    return (
      <div className="min-h-screen flex flex-col bg-red-50">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center mb-8 relative">
            {recording ? (
              <div className="absolute w-full h-full rounded-full bg-red-400 animate-ping opacity-75"></div>
            ) : null}
            {recording ? <MicOff size={48} className="text-white animate-pulse" /> : <Mic size={48} className="text-white" />}
          </div>
          
          <h2 className="text-xl font-bold text-center mb-4">
            {recording ? "Tell us what's happening..." : "Tap to describe your emergency"}
          </h2>
          
          <p className="text-center text-gray-700 mb-8">
            {recording 
              ? "We're listening to your emergency. Please speak clearly." 
              : "Tap the microphone to start describing your emergency situation."}
          </p>
          
          {recording && (
            <div className="text-center text-red-600 animate-pulse mb-4">
              <p>If no voice is detected in 5 seconds, an emergency alert will be automatically sent</p>
            </div>
          )}
          
          {isProcessing ? (
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <p>Processing your emergency...</p>
              </div>
              <Progress value={processingProgress} className="h-2" />
              <p className="text-sm text-center text-gray-500">Analyzing your voice and preparing emergency response</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <Button 
                onClick={recording ? stopRecording : startRecording} 
                className={`px-8 py-4 rounded-lg ${recording ? 'bg-gray-600' : 'bg-red-600'} text-white font-medium`}
              >
                {recording ? 'Stop Recording' : 'Start Recording'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setShowVoicePrompt(false);
                  // Create a default emergency
                  createEmergencyRecord("Medical emergency reported").then(record => {
                    if (record?.id) {
                      setEmergencyId(record.id);
                      notifyFrontlineWorkers(record.id);
                      setAlertSent(true);

                      // Add initial AI guidance
                      setConversationHistory([{
                        role: 'assistant',
                        content: "I'm here to help with your emergency. Help is on the way. Can you tell me what's happening so I can provide specific guidance?"
                      }]);

                      // Speak the initial guidance
                      speakResponse("I'm here to help with your emergency. Help is on the way. Can you tell me what's happening so I can provide specific guidance?");
                    }
                  });
                }} 
                className="px-8 py-4 rounded-lg text-gray-700"
              >
                Skip Voice Input
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => navigate('/')} 
                className="px-8 py-4 rounded-lg text-gray-500"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Audio element for text-to-speech
  const audioElement = <audio ref={audioRef} className="hidden"></audio>;

  // Main emergency alert screen
  return (
    <div className="min-h-screen bg-gray-50 relative pb-24">
      <Header />
      <div className="p-4 pb-32">
        <div className="flex items-center mb-4">
          <Link to="/" className="mr-2">
            <ArrowLeft />
          </Link>
          <h1 className="text-xl font-bold">Emergency Alert</h1>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Alert Status</h2>
            <span className="bg-eresq-red text-white px-2 py-1 rounded-full text-sm">
              ACTIVE
            </span>
          </div>

          <p className="text-gray-600 mb-4">
            Your emergency alert has been sent to nearby responders.
          </p>

          {transcription && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
              <p className="text-gray-800 text-sm font-semibold">Your emergency:</p>
              <p className="text-gray-700">{emergencyDescription || transcription.substring(0, 100) + '...'}</p>
            </div>
          )}

          {!alertSent ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2 animate-ping"></div>
                <p>Sending alert to nearby responders...</p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
              <p className="text-green-800 text-sm">
                Alert sent successfully! Responders are being notified.
              </p>
            </div>
          )}
        </div>

        {/* Chat with AI for help during emergency */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="text-lg font-semibold mb-3">Emergency AI Assistant</h2>
          
          <div 
            ref={chatContainerRef} 
            className="max-h-64 overflow-y-auto mb-4 space-y-3 p-1"
          >
            {conversationHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Analyzing your emergency and preparing assistance...
              </p>
            ) : (
              conversationHistory.map((msg, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-50 ml-8' 
                      : 'bg-gray-50 mr-8'
                  }`}
                >
                  <p className="text-sm font-semibold mb-1">
                    {msg.role === 'user' ? 'You' : 'Emergency Assistant'}:
                  </p>
                  <p className="text-gray-700">{msg.content}</p>
                </div>
              ))
            )}
            
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
            
            {/* Voice input indicator */}
            {waitingForVoiceInput && !recording && !isProcessing && (
              <div 
                className="flex justify-center space-x-2 my-2 p-2 bg-blue-50 border border-blue-100 rounded-lg cursor-pointer"
                onClick={handleVoiceInput}
              >
                <Mic size={16} className="text-blue-500 animate-pulse" />
                <span className="text-blue-600 text-sm">Tap here to speak</span>
              </div>
            )}
            
            {recording && (
              <div className="flex justify-center space-x-2 my-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                <MicOff size={16} className="text-red-500 animate-pulse" onClick={stopVoiceRecording} />
                <span className="text-red-600 text-sm">Recording... tap to stop</span>
              </div>
            )}
            
            {isProcessing && (
              <div className="flex justify-center my-2">
                <Progress value={processingProgress} className="w-3/4 h-2" />
              </div>
            )}
          </div>
          
          <form onSubmit={handleChatSubmit} className="flex items-end space-x-2">
            <Textarea 
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              placeholder="Ask for help or advice..."
              className="text-sm resize-none"
            />
            <Button type="submit" size="icon" variant="secondary">
              <Send size={16} />
            </Button>
          </form>
        </div>

        <h2 className="text-lg font-semibold mt-6 mb-3">Available Responders</h2>

        <div className="space-y-3">
          {responders.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse">
                <p>Looking for nearby responders...</p>
              </div>
            </div>
          ) : (
            responders.map((responder) => (
              <div
                key={responder.id}
                className="bg-white rounded-lg p-4 shadow-sm flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium">{responder.name}</h3>
                    {responder.status === "accepted" && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Arriving
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{responder.role}</p>
                  <p className="text-sm text-gray-500">{responder.distance} away</p>
                </div>
                <div className="flex items-center">
                  {responder.status === "accepted" ? (
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                  ) : (
                    <CircleX className="text-gray-400 mr-2" size={20} />
                  )}
                  <Link to={`tel:${responder.phoneNumber}`} className="ml-2">
                    <PhoneCall size={20} className="text-eresq-navy" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={handleCancelEmergency}
          className="w-full bg-red-500 text-white py-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
        >
          Cancel Emergency
        </button>
      </div>
      
      {audioElement}
      <BottomNavBar />
      
      <style>{`
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

export default SOSAlert;
