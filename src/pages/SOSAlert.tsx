import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, CircleX, PhoneCall } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { useToast } from "@/hooks/use-toast";

interface Responder {
  id: string;
  name: string;
  role: string;
  status: "pending" | "accepted";
  distance: string;
  phoneNumber: string;
}

const SOSAlert = () => {
  const [responders, setResponders] = useState<Responder[]>([]);
  const [alertSent, setAlertSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const simulateAlert = setTimeout(() => {
      setAlertSent(true);
      setResponders([
        {
          id: "1",
          name: "Dr. Rajesh Kumar",
          role: "Medical Officer",
          status: "accepted",
          distance: "1.2 km",
          phoneNumber: "+91 98765 43210",
        },
        {
          id: "2",
          name: "Sunita Sharma",
          role: "ASHA Worker",
          status: "accepted",
          distance: "0.8 km",
          phoneNumber: "+91 87654 32109",
        },
        {
          id: "3",
          name: "Amit Singh",
          role: "ANM",
          status: "pending",
          distance: "2.5 km",
          phoneNumber: "+91 76543 21098",
        },
        {
          id: "4",
          name: "Dr. Priya Patel",
          role: "PHC Doctor",
          status: "pending",
          distance: "3.1 km",
          phoneNumber: "+91 65432 10987",
        },
      ]);
    }, 2000);

    const simulateResponses = setTimeout(() => {
      setResponders((prev) =>
        prev.map((responder) => {
          if (responder.id === "3") {
            return { ...responder, status: "accepted" };
          }
          return responder;
        })
      );
    }, 5000);

    return () => {
      clearTimeout(simulateAlert);
      clearTimeout(simulateResponses);
    };
  }, []);

  const handleCancelEmergency = () => {
    toast({
      title: "Emergency Cancelled",
      description: "Your emergency request has been cancelled.",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 relative pb-24">
      <Header />
      <div className="p-4 pb-32">
        <div className="flex items-center mb-4">
          <Link to="/" className="mr-2">
            <ArrowLeft />
          </Link>
          <h1 className="text-xl font-bold">Emergency Alert</h1>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Alert Status</h2>
            <span className="bg-eresq-red text-white px-2 py-1 rounded-full text-sm">
              ACTIVE
            </span>
          </div>

          <p className="text-gray-600 mb-4">
            Your emergency alert has been sent to nearby responders.
          </p>

          {!alertSent ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2 animate-ping"></div>
                <p>Sending alert to nearby responders...</p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
              <p className="text-green-800 text-sm">
                Alert sent successfully! Responders are being notified.
              </p>
            </div>
          )}
        </div>

        <h2 className="text-lg font-semibold mt-6 mb-3">Available Responders</h2>

        <div className="space-y-3">
          {responders.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse">
                <p>Looking for nearby responders...</p>
              </div>
            </div>
          ) : (
            responders.map((responder) => (
              <div
                key={responder.id}
                className="bg-white rounded-lg p-4 shadow-sm flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium">{responder.name}</h3>
                    {responder.status === "accepted" && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Arriving
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{responder.role}</p>
                  <p className="text-sm text-gray-500">{responder.distance} away</p>
                </div>
                <div className="flex items-center">
                  {responder.status === "accepted" ? (
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                  ) : (
                    <CircleX className="text-gray-400 mr-2" size={20} />
                  )}
                  <Link to={`tel:${responder.phoneNumber}`} className="ml-2">
                    <PhoneCall size={20} className="text-eresq-navy" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={handleCancelEmergency}
          className="w-full bg-red-500 text-white py-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
        >
          Cancel Emergency
        </button>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default SOSAlert;
