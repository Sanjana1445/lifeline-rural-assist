
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
        <AlertBanner message="New Alert: Nearby medical unit available" />
        
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
      </div>
      <BottomNavBar />
    </div>
  );
};

export default Index;
