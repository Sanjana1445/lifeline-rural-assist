
import { useState } from "react";
import { ArrowLeft, MessageSquare, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";

interface CFR {
  id: string;
  name: string;
  role: string;
  distance: string;
  available: boolean;
  phone: string;
}

const ConnectCFRs = () => {
  const [cfrs] = useState<CFR[]>([
    {
      id: "1",
      name: "Rahul Sharma",
      role: "ASHA Worker",
      distance: "0.8 km",
      available: true,
      phone: "+91 9876543210",
    },
    {
      id: "2",
      name: "Priya Mehta",
      role: "ANM",
      distance: "1.3 km",
      available: true,
      phone: "+91 8765432109",
    },
    {
      id: "3",
      name: "Suresh Patel",
      role: "Community Volunteer",
      distance: "1.7 km",
      available: false,
      phone: "+91 7654321098",
    },
    {
      id: "4",
      name: "Anita Singh",
      role: "Red Cross Volunteer",
      distance: "2.1 km",
      available: true,
      phone: "+91 6543210987",
    },
    {
      id: "5",
      name: "Mohan Kumar",
      role: "PHC Staff",
      distance: "2.8 km",
      available: true,
      phone: "+91 5432109876",
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <div className="flex items-center mb-4">
          <Link to="/" className="mr-2">
            <ArrowLeft />
          </Link>
          <h1 className="text-xl font-bold">Connect with CFRs</h1>
        </div>

        <p className="text-gray-600 mb-4">
          Community First Responders (CFRs) in your area who can provide
          assistance in case of emergency:
        </p>

        <div className="grid grid-cols-2 gap-3">
          {cfrs.map((cfr) => (
            <div
              key={cfr.id}
              className="bg-white rounded-lg p-3 shadow-sm flex flex-col"
            >
              <div className="mb-2">
                <h3 className="font-medium text-sm">{cfr.name}</h3>
                <p className="text-xs text-gray-500">{cfr.role}</p>
                <p className="text-xs text-gray-500">{cfr.distance} away</p>
                <p
                  className={`text-xs mt-1 ${
                    cfr.available ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {cfr.available ? "Available" : "Unavailable"}
                </p>
              </div>
              <div className="mt-auto flex justify-between">
                <Link to={`tel:${cfr.phone}`} className="text-eresq-navy">
                  <PhoneCall size={18} />
                </Link>
                <Link to={`/message/${cfr.id}`} className="text-eresq-navy">
                  <MessageSquare size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default ConnectCFRs;
