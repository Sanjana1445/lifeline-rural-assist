import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, CircleX, PhoneCall } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
interface Responder {
  id: string;
  name: string;
  role: string;
  status: "pending" | "accepted";
  distance: string;
  phoneNumber: string;
}
type EmergencyStatus = "new" | "accepted" | "declined" | "cancelled";
const SOSAlert = () => {
  const [responders, setResponders] = useState<Responder[]>([]);
  const [alertSent, setAlertSent] = useState(false);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [emergencyDescription, setEmergencyDescription] = useState("");
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  useEffect(() => {
    // Simulate alert being sent immediately
    setAlertSent(true);

    // Create emergency record and simulate responders
    createEmergencyRecord("Emergency reported").then(record => {
      if (record?.id) {
        setEmergencyId(record.id);
        notifyFrontlineWorkers(record.id);
      }
    });

    // Load responders
    const fetchResponders = async () => {
      if (user && emergencyId) {
        try {
          // Get emergency responses with responder profiles
          const {
            data,
            error
          } = await supabase.from('emergency_responses').select(`
              id, 
              status,
              responder_id
            `).eq('emergency_id', emergencyId);
          if (error) throw error;
          if (data && data.length > 0) {
            // Get responder profiles for all emergency responses
            const responderIds = data.map(item => item.responder_id);
            const {
              data: profilesData,
              error: profilesError
            } = await supabase.from('profiles').select(`
                id, 
                full_name, 
                frontline_type,
                phone
              `).in('id', responderIds);
            if (profilesError) throw profilesError;
            if (profilesData && profilesData.length > 0) {
              // Get frontline types to map type IDs to names
              const {
                data: frontlineTypes,
                error: typesError
              } = await supabase.from('frontline_types').select('*');
              if (typesError) throw typesError;
              const typeMap = frontlineTypes ? frontlineTypes.reduce((acc: Record<string, string>, type) => {
                acc[type.id] = type.name;
                return acc;
              }, {}) : {};

              // Transform the data to match our responders structure
              const transformedResponders = data.map(responseItem => {
                const profile = profilesData.find(p => p.id === responseItem.responder_id);
                if (!profile) return null;

                // Ensure status is one of the allowed types
                let typedStatus: "pending" | "accepted" = "pending";
                if (responseItem.status === "accepted") {
                  typedStatus = "accepted";
                }
                return {
                  id: responseItem.id,
                  name: profile.full_name || 'Unknown Responder',
                  role: profile.frontline_type && typeMap[profile.frontline_type] ? typeMap[profile.frontline_type] : 'Healthcare Worker',
                  status: typedStatus,
                  distance: "Calculating...",
                  // This would come from a location service
                  phoneNumber: profile.phone || "+91 98765 43210"
                };
              }).filter(Boolean) as Responder[];
              setResponders(transformedResponders);
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching responders:', error);
        }
      }

      // Fallback to simulated data
      setResponders([{
        id: "1",
        name: "Dr. Rajesh Kumar",
        role: "Medical Officer",
        status: "accepted",
        distance: "1.2 km",
        phoneNumber: "+91 98765 43210"
      }, {
        id: "2",
        name: "Sunita Sharma",
        role: "ASHA Worker",
        status: "accepted",
        distance: "0.8 km",
        phoneNumber: "+91 87654 32109"
      }, {
        id: "3",
        name: "Amit Singh",
        role: "ANM",
        status: "pending",
        distance: "2.5 km",
        phoneNumber: "+91 76543 21098"
      }, {
        id: "4",
        name: "Dr. Priya Patel",
        role: "PHC Doctor",
        status: "pending",
        distance: "3.1 km",
        phoneNumber: "+91 65432 10987"
      }]);
    };
    fetchResponders();
  }, [user, emergencyId]);
  const createEmergencyRecord = async (description: string) => {
    try {
      if (!user) {
        console.warn("No user logged in, using simulated emergency record");
        return {
          id: "simulated-emergency-id"
        };
      }
      const {
        data,
        error
      } = await supabase.from('emergencies').insert({
        patient_id: user.id,
        description: description,
        location: "User location",
        // In a real app, this would be GPS coordinates
        status: "new" as EmergencyStatus
      }).select('id').single();
      if (error) {
        console.error("Error creating emergency record:", error);
        throw error;
      }
      toast({
        title: "Emergency Created",
        description: "Your emergency has been recorded and help is on the way."
      });
      return data;
    } catch (error) {
      console.error("Failed to create emergency record:", error);
      return null;
    }
  };
  const notifyFrontlineWorkers = async (emergencyId: string) => {
    try {
      if (!emergencyId) return;

      // Get nearby frontline workers
      const {
        data: frontlineWorkers,
        error
      } = await supabase.from('profiles').select('id').eq('is_frontline_worker', true).limit(5);
      if (error) throw error;
      if (frontlineWorkers && frontlineWorkers.length > 0) {
        // Create emergency response records for each worker
        const responseRecords = frontlineWorkers.map(worker => ({
          emergency_id: emergencyId,
          responder_id: worker.id,
          status: 'pending'
        }));
        const {
          error: insertError
        } = await supabase.from('emergency_responses').insert(responseRecords);
        if (insertError) throw insertError;
        toast({
          title: "Responders Notified",
          description: `${frontlineWorkers.length} frontline workers have been notified of your emergency.`
        });
        return frontlineWorkers.length;
      } else {
        toast({
          title: "No Responders Found",
          description: "We couldn't find any available frontline workers. Using simulated responders."
        });
        return 0;
      }
    } catch (error) {
      console.error("Failed to notify frontline workers:", error);
      return 0;
    }
  };
  const handleCancelEmergency = async () => {
    // Update emergency status in the database
    if (user && emergencyId) {
      try {
        const {
          error
        } = await supabase.from('emergencies').update({
          status: 'cancelled' as EmergencyStatus
        }).eq('id', emergencyId);
        if (error) throw error;
        toast({
          title: "Emergency Cancelled",
          description: "Your emergency request has been cancelled."
        });
        navigate('/');
      } catch (error) {
        console.error('Error cancelling emergency:', error);
        toast({
          title: "Error",
          description: "Failed to cancel the emergency. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Emergency Cancelled",
        description: "Your emergency request has been cancelled."
      });
      navigate('/');
    }
  };
  return <div className="min-h-screen bg-gray-50">
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

          {emergencyDescription && <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
              <p className="text-gray-800 text-sm font-semibold">Your emergency:</p>
              <p className="text-gray-700">{emergencyDescription}</p>
            </div>}

          {!alertSent ? <div className="flex items-center justify-center h-32">
              <div className="animate-pulse flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2 animate-ping"></div>
                <p>Sending alert to nearby responders...</p>
              </div>
            </div> : <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
              <p className="text-green-800 text-sm">
                Alert sent successfully! Responders are being notified.
              </p>
            </div>}
        </div>

        {/* ElevenLabs Convai Widget */}
        

        <h2 className="text-lg font-semibold mt-6 mb-3">Available Responders</h2>

        <div className="space-y-3">
          {responders.length === 0 ? <div className="flex items-center justify-center h-32">
              <div className="animate-pulse">
                <p>Looking for nearby responders...</p>
              </div>
            </div> : responders.map(responder => <div key={responder.id} className="bg-white rounded-lg p-4 shadow-sm flex justify-between items-center">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium">{responder.name}</h3>
                    {responder.status === "accepted" && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Arriving
                      </span>}
                  </div>
                  <p className="text-sm text-gray-500">{responder.role}</p>
                  <p className="text-sm text-gray-500">{responder.distance} away</p>
                </div>
                <div className="flex items-center">
                  {responder.status === "accepted" ? <CheckCircle className="text-green-500 mr-2" size={20} /> : <CircleX className="text-gray-400 mr-2" size={20} />}
                  <Link to={`tel:${responder.phoneNumber}`} className="ml-2">
                    <PhoneCall size={20} className="text-eresq-navy" />
                  </Link>
                </div>
              </div>)}
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t py-0 px-[16px]">
        <button onClick={handleCancelEmergency} className="w-full bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors py-[26px] text-2xl my-[40px]">
          Cancel Emergency
        </button>
      </div>
      
      <BottomNavBar />
    </div>;
};
export default SOSAlert;