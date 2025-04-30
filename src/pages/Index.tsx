
import { MapPin, Users, Microchip, Mic } from "lucide-react";
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
        <AlertBanner message="New Feature: Voice AI assistance in local languages!" />
        
        <SOSButton />
        
        <div className="mt-2 text-center">
          <span className="inline-flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            <Mic size={14} className="mr-1 text-eresq-red" />
            Voice-enabled emergency reporting
          </span>
        </div>
        
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
          <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            <Mic size={12} className="mr-1 text-blue-500" />
            Voice-enabled medical assistance
          </span>
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default Index;
