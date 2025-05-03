
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
  phoneNumber: string;
}

type EmergencyStatus = "new" | "accepted" | "declined" | "cancelled";

const SOSAlert = () => {
  const [responders, setResponders] = useState<Responder[]>([]);
  const [alertSent, setAlertSent] = useState(false);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [emergencyDescription, setEmergencyDescription] = useState("Medical emergency reported");
  const [emergencyCreated, setEmergencyCreated] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Unable to access your location. Some features may be limited.",
            variant: "destructive"
          });
        }
      );
    }
  }, [toast]);

  useEffect(() => {
    // Only create emergency record if it hasn't been created yet
    if (!emergencyCreated) {
      // Simulate alert being sent immediately
      setAlertSent(true);

      // Create emergency record only once
      createEmergencyRecord("Medical emergency reported").then(record => {
        if (record?.id) {
          setEmergencyId(record.id);
          setEmergencyCreated(true);
        }
      });
    }

    // Load responders when emergency ID is available
    if (user && emergencyId) {
      fetchResponders();
    }
  }, [user, emergencyId, emergencyCreated]);

  // Set up real-time subscription for responder updates
  useEffect(() => {
    if (emergencyId) {
      const subscription = supabase
        .channel('emergency-responses')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'emergency_responses',
          filter: `emergency_id=eq.${emergencyId}`
        }, () => {
          // Refetch responders when changes occur
          fetchResponders();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [emergencyId]);

  const fetchResponders = async () => {
    if (emergencyId) {
      try {
        console.log("Fetching responders for emergency ID:", emergencyId);
        
        // Get emergency responses with responder profiles
        const { data: responseData, error: responseError } = await supabase
          .from('emergency_responses')
          .select(`
            id, 
            status,
            responder_id
          `)
          .eq('emergency_id', emergencyId);
          
        if (responseError) {
          console.error("Error fetching emergency responses:", responseError);
          throw responseError;
        }
        
        console.log("Emergency responses data:", responseData);
        
        if (responseData && responseData.length > 0) {
          // Get responder profiles for all emergency responses
          const responderIds = responseData.map(item => item.responder_id);
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select(`
              id, 
              full_name, 
              frontline_type,
              phone
            `)
            .in('id', responderIds);
            
          if (profilesError) {
            console.error("Error fetching responder profiles:", profilesError);
            throw profilesError;
          }
          
          console.log("Profiles data:", profilesData);
          
          if (profilesData && profilesData.length > 0) {
            // Get frontline types to map type IDs to names
            const { data: frontlineTypes, error: typesError } = await supabase
              .from('frontline_types')
              .select('*');
              
            if (typesError) {
              console.error("Error fetching frontline types:", typesError);
              throw typesError;
            }
            
            console.log("Frontline types:", frontlineTypes);
            
            const typeMap = frontlineTypes ? frontlineTypes.reduce((acc: Record<string, string>, type) => {
              acc[type.id] = type.name;
              return acc;
            }, {}) : {};

            // Transform the data to match our responders structure
            const transformedResponders = responseData.map(responseItem => {
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
                phoneNumber: profile.phone || ""
              };
            }).filter(Boolean) as Responder[];
            
            console.log("Transformed responders:", transformedResponders);
            
            if (transformedResponders.length > 0) {
              setResponders(transformedResponders);
              return;
            } else {
              console.log("No valid responders found after transformation");
            }
          } else {
            console.log("No profile data found for responders");
          }
        } else {
          console.log("No emergency responses found");
        }
      } catch (error) {
        console.error('Error fetching responders:', error);
      }
    }
  };

  const createEmergencyRecord = async (description: string) => {
    try {
      if (!user) {
        console.warn("No user logged in, cannot create emergency record");
        return null;
      }
      
      console.log("Creating emergency record with:", { 
        patient_id: user.id, 
        description, 
        location: userLocation ? `${userLocation.lat},${userLocation.lng}` : "Unknown location"
      });
      
      // Create emergency record with user location
      const { data, error } = await supabase
        .from('emergencies')
        .insert({
          patient_id: user.id,
          description: description,
          location: userLocation ? `${userLocation.lat},${userLocation.lng}` : "Unknown location",
          latitude: userLocation?.lat || null,
          longitude: userLocation?.lng || null,
          status: "new" as EmergencyStatus,
          is_in_history: true
        })
        .select('id')
        .single();
        
      if (error) {
        console.error("Error creating emergency record:", error);
        toast({
          title: "Error",
          description: "Failed to create emergency record. Please try again.",
          variant: "destructive"
        });
        throw error;
      }
      
      console.log("Emergency record created:", data);
      
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

  const handleCancelEmergency = async () => {
    // Update emergency status in the database
    if (user && emergencyId) {
      try {
        const { error } = await supabase
          .from('emergencies')
          .update({
            status: 'cancelled' as EmergencyStatus
          })
          .eq('id', emergencyId);
          
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

  return (
    <div className="min-h-screen bg-gray-50">
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

          {emergencyDescription && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
              <p className="text-gray-800 text-sm font-semibold">Your emergency:</p>
              <p className="text-gray-700">{emergencyDescription}</p>
            </div>
          )}

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

        {/* ElevenLabs Convai Widget for SOS Alert */}
        <div className="mb-4">
          <elevenlabs-convai agent-id="936JwZECCENUoVq4QME1"></elevenlabs-convai>
          <script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
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
            responders.map(responder => (
              <div key={responder.id} className="bg-white rounded-lg p-4 shadow-sm flex justify-between items-center">
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
      
      {/* Fix the Cancel Emergency button to be above BottomNavBar but not behind it */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t">
        <Button 
          onClick={handleCancelEmergency} 
          variant="destructive"
          className="w-full py-3 text-base font-medium"
        >
          Cancel Emergency
        </Button>
      </div>
      
      <BottomNavBar />
    </div>
  );
};

export default SOSAlert;
