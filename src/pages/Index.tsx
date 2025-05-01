
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
        <AlertBanner message="Coming soon: Voice AI assistance in multiple local languages!" />
        
        <SOSButton />
        
        <div className="mt-2 text-center">
          <button 
            onClick={() => setShowVoiceInfo(!showVoiceInfo)}
            className="inline-flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200"
          >
            <Mic size={14} className="mr-1 text-eresq-red" />
            Voice features coming soon
          </button>
        </div>
        
        {showVoiceInfo && (
          <div className="mt-2 bg-blue-50 p-3 rounded-lg text-sm">
            <h4 className="font-medium text-blue-800">Voice features:</h4>
            <ul className="mt-1 space-y-1 text-blue-700 list-disc pl-4">
              <li>Voice-enabled emergency reporting (Coming soon)</li>
              <li>Support for multiple languages including English, Hindi, and Telugu</li>
              <li>Voice response for accessibility</li>
            </ul>
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
            Voice features coming soon
          </button>
        </div>
        
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium text-lg text-center mb-2">Voice Features Information</h3>
          <div className="text-xs bg-gray-50 p-2 rounded">
            <p className="font-medium">Voice features are coming soon:</p>
            <ul className="mt-1 space-y-1 pl-4 list-disc">
              <li>Speak to report emergencies</li>
              <li>Voice-guided medical assistance</li>
              <li>Support for multiple languages</li>
              <li>Accessible for low-literacy users</li>
            </ul>
          </div>
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default Index;
