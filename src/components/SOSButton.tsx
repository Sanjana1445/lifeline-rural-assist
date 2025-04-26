
import { Link } from "react-router-dom";

const SOSButton = () => {
  return (
    <Link to="/sos-alert" className="block">
      <div className="w-32 h-32 bg-eresq-red rounded-full flex items-center justify-center mx-auto my-6 shadow-lg">
        <span className="text-white text-4xl font-bold">SOS</span>
      </div>
      <p className="text-center text-gray-600 mt-2">Tap to alert nearby responders</p>
    </Link>
  );
};

export default SOSButton;
