
import { Check } from "lucide-react";

const Header = () => {
  return (
    <div className="bg-eresq-navy text-white p-4 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="font-bold text-lg">eRESQ</h1>
      </div>
      <div className="bg-teal-500 rounded-full p-1">
        <Check size={20} />
      </div>
    </div>
  );
};

export default Header;
