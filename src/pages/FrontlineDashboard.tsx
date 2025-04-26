
import { useState } from "react";
import { ArrowLeft, CheckCircle, CircleX, Navigation, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";

interface Emergency {
  id: string;
  patientName: string;
  location: string;
  distance: string;
  timeElapsed: string;
  status: "new" | "accepted" | "declined";
  description: string;
}

const FrontlineDashboard = () => {
  const [emergencies, setEmergencies] = useState<Emergency[]>([
    {
      id: "1",
      patientName: "Ramesh Kumar",
      location: "Village Nagar, Block A",
      distance: "1.2 km",
      timeElapsed: "2 minutes ago",
      status: "new",
      description: "Complaining of chest pain and difficulty breathing",
    },
    {
      id: "2",
      patientName: "Meena Singh",
      location: "Central Road, District HQ",
      distance: "0.8 km",
      timeElapsed: "5 minutes ago",
      status: "new",
      description: "Fall from height, possible fracture",
    },
    {
      id: "3",
      patientName: "Arjun Patel",
      location: "School Road, Village Center",
      distance: "1.5 km",
      timeElapsed: "8 minutes ago",
      status: "new",
      description: "High fever and seizures in child",
    },
    {
      id: "4",
      patientName: "Lakshmi Devi",
      location: "Temple Street, Old Town",
      distance: "2.3 km",
      timeElapsed: "12 minutes ago",
      status: "new",
      description: "Pregnant woman in labor",
    },
  ]);

  const handleAccept = (id: string) => {
    setEmergencies((prev) =>
      prev.map((emergency) =>
        emergency.id === id
          ? { ...emergency, status: "accepted" }
          : emergency
      )
    );
  };

  const handleDecline = (id: string) => {
    setEmergencies((prev) =>
      prev.map((emergency) =>
        emergency.id === id
          ? { ...emergency, status: "declined" }
          : emergency
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Frontline Worker Dashboard</h1>
          <Link to="/profile" className="text-eresq-navy">
            <ArrowLeft size={20} />
          </Link>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="font-medium text-lg mb-2">Your Status</h2>
          <div className="flex items-center text-green-600">
            <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
            <span>Active - Ready to Respond</span>
          </div>
        </div>

        <h2 className="text-lg font-semibold mt-6 mb-3">Nearby Emergencies</h2>

        {emergencies.length === 0 ? (
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <p className="text-gray-600">No active emergencies in your area.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {emergencies.map((emergency) => (
              <div
                key={emergency.id}
                className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${
                  emergency.status === "accepted"
                    ? "border-green-500"
                    : emergency.status === "declined"
                    ? "border-gray-300"
                    : "border-eresq-red"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{emergency.patientName}</h3>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Clock size={14} className="mr-1" />
                    <span>{emergency.timeElapsed}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-1">
                  📍 {emergency.location} ({emergency.distance} away)
                </p>
                
                <p className="text-sm mb-3">{emergency.description}</p>
                
                {emergency.status === "new" ? (
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => handleAccept(emergency.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md text-sm flex-grow mr-2"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(emergency.id)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm flex-grow"
                    >
                      Decline
                    </button>
                  </div>
                ) : emergency.status === "accepted" ? (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-green-600">
                      <CheckCircle size={16} className="mr-1" />
                      <span className="text-sm">Accepted</span>
                    </div>
                    <button className="flex items-center bg-eresq-navy text-white px-3 py-1 rounded-md text-sm">
                      <Navigation size={14} className="mr-1" />
                      Navigate
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <CircleX size={16} className="mr-1" />
                    <span className="text-sm">Declined</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};

export default FrontlineDashboard;
