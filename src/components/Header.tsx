
import { Check } from "lucide-react";

const Header = () => {
  return (
    <div className="bg-eresq-navy text-white p-4 flex items-center justify-between">
      <div className="flex items-center">
        <svg 
          className="w-6 h-6 mr-2" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <h1 className="text-xl font-bold">eRESQ</h1>
      </div>
      <div className="bg-teal-500 rounded-full p-1">
        <Check size={20} />
      </div>
    </div>
  );
};

export default Header;
