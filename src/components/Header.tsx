
import { Check } from "lucide-react";

const Header = () => {
  return (
    <div className="bg-eresq-navy text-white p-4 flex items-center justify-between">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/2a802fda-4533-464f-9c8c-c9c8070166cb.png" 
          alt="eRESQ Logo" 
          className="h-6 mr-2" 
        />
      </div>
      <div className="bg-teal-500 rounded-full p-1">
        <Check size={20} />
      </div>
    </div>
  );
};

export default Header;
