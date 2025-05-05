
import { Check } from "lucide-react";

const Header = () => {
  return (
    <div className="bg-eresq-navy text-white p-4 flex items-center justify-between">
      <div className="flex items-center">
        <img 
          src="https://i.ibb.co/hM16wLH/NQJFK4B.jpg" 
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
