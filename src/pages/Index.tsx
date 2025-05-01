
import { MapPin, Users, Microchip } from "lucide-react";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import SOSButton from "../components/SOSButton";
import FeatureButton from "../components/FeatureButton";
import AlertBanner from "../components/AlertBanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <AlertBanner message="AI voice assistance now available in SOS and Triage sections!" />
        
        <SOSButton />
        
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
        
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium text-lg text-center mb-2">Voice AI Assistant</h3>
          <div className="text-xs bg-gray-50 p-2 rounded">
            <p className="font-medium">Our voice assistance features are now available!</p>
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
