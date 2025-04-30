
import { MapPin, Users, Microchip, Mic, VolumeX, Volume2 } from "lucide-react";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import SOSButton from "../components/SOSButton";
import FeatureButton from "../components/FeatureButton";
import AlertBanner from "../components/AlertBanner";
import { useState } from "react";

const Index = () => {
  const [showVoiceInfo, setShowVoiceInfo] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <AlertBanner message="Voice AI assistance in multiple local languages is now available!" />
        
        <SOSButton />
        
        <div className="mt-2 text-center">
          <button 
            onClick={() => setShowVoiceInfo(!showVoiceInfo)}
            className="inline-flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200"
          >
            <Mic size={14} className="mr-1 text-eresq-red" />
            Voice-enabled emergency reporting
          </button>
        </div>
        
        {showVoiceInfo && (
          <div className="mt-2 bg-blue-50 p-3 rounded-lg text-sm">
            <h4 className="font-medium text-blue-800">How to use voice features:</h4>
            <ul className="mt-1 space-y-1 text-blue-700 list-disc pl-4">
              <li>Tap the SOS button and use voice commands to explain your emergency</li>
              <li>Works in multiple languages including English, Hindi, and Telugu</li>
              <li>Speak clearly and directly into your microphone</li>
              <li>If you don't speak for 5 seconds, emergency alert will be sent automatically</li>
            </ul>
            <div className="mt-2 p-2 bg-blue-100 rounded flex items-start">
              <Volume2 size={16} className="mr-1 text-blue-700 mt-0.5" />
              <p className="text-xs text-blue-800">The AI will respond with voice so you can hear the instructions even if you cannot read</p>
            </div>
          </div>
        )}
        
        <div className="mt-6 space-y-4">
          <FeatureButton 
            icon={MapPin} 
            label="Find Nearest Clinic" 
            to="/nearest-clinic" 
          />
          <FeatureButton 
            icon={Users} 
            label="Connect with CFRs" 
            to="/connect-cfrs" 
          />
          <FeatureButton 
            icon={Microchip} 
            label="Triage & Symptom Checker" 
            to="/triage" 
          />
        </div>
        
        <div className="mt-3 text-center">
          <button 
            onClick={() => setShowVoiceInfo(!showVoiceInfo)}
            className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full hover:bg-gray-200"
          >
            <Mic size={12} className="mr-1 text-blue-500" />
            Voice-enabled medical assistance
          </button>
        </div>
        
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium text-lg text-center mb-2">Voice AI Troubleshooting</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <VolumeX size={18} className="text-red-500 mr-2 mt-0.5" />
              <p>If you see a "Voice Processing Error", please ensure your microphone is properly connected and permissions are granted.</p>
            </div>
            <div className="text-xs bg-gray-50 p-2 rounded">
              <p className="font-medium">Tips for better voice recognition:</p>
              <ul className="mt-1 space-y-1 pl-4 list-disc">
                <li>Speak clearly and at normal speed</li>
                <li>Minimize background noise</li>
                <li>Hold your device 6-12 inches from your face</li>
                <li>Use simple and direct phrases</li>
                <li>If the first attempt fails, try again</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default Index;
