
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, CircleX, Navigation, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Emergency {
  id: string;
  patientName: string;
  location: string;
  status: "new" | "accepted" | "declined";
  description: string;
  timeElapsed: string;
  emergencyResponseId?: string;
  coordinates?: { lat: number; lng: number };
}

const FrontlineDashboard = () => {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Function to calculate time elapsed
  const getTimeElapsed = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return "More than a day ago";
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchEmergencies = async () => {
      setLoading(true);
      try {
        // First get the frontline worker's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, is_frontline_worker')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        if (!profileData.is_frontline_worker) {
          toast({
            title: "Access Restricted",
            description: "This dashboard is only for frontline workers.",
            variant: "destructive",
          });
          setEmergencies([]);
          setLoading(false);
          return;
        }
        
        // Get all emergency responses for this frontline worker
        const { data: responseData, error: responseError } = await supabase
          .from('emergency_responses')
          .select('id, status, emergency_id')
          .eq('responder_id', user.id);
          
        if (responseError) throw responseError;
        
        if (responseData && responseData.length > 0) {
          // Get all the emergency IDs
          const emergencyIds = responseData.map(r => r.emergency_id);
          
          // Get emergency details with patient location
          const { data: emergencyData, error: emergencyError } = await supabase
            .from('emergencies')
            .select(`
              id, 
              description, 
              status, 
              location, 
              latitude,
              longitude,
              created_at,
              patient_id
            `)
            .in('id', emergencyIds)
            .order('created_at', { ascending: false });
            
          if (emergencyError) throw emergencyError;
          
          if (emergencyData && emergencyData.length > 0) {
            // Get patient profiles
            const patientIds = emergencyData.map(e => e.patient_id);
            
            const { data: patientData, error: patientError } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', patientIds);
              
            if (patientError) throw patientError;
            
            // Transform data into our Emergency interface format
            const transformedEmergencies = emergencyData.map(emergency => {
              // Find the corresponding response record
              const response = responseData.find(r => r.emergency_id === emergency.id);
              // Find the patient profile
              const patient = patientData?.find(p => p.id === emergency.patient_id);
              
              // Ensure status is one of the allowed types
              let typedStatus: "new" | "accepted" | "declined" = "new";
              if (response?.status === "accepted") {
                typedStatus = "accepted";
              } else if (response?.status === "declined") {
                typedStatus = "declined";
              }
              
              // Get coordinates from the emergency record if available
              const coordinates = emergency.latitude && emergency.longitude ? 
                { lat: emergency.latitude, lng: emergency.longitude } : 
                undefined;
              
              return {
                id: emergency.id,
                patientName: patient?.full_name || "Unknown Patient",
                location: emergency.location || "Unknown Location",
                timeElapsed: getTimeElapsed(emergency.created_at),
                status: typedStatus,
                description: emergency.description,
                emergencyResponseId: response?.id,
                coordinates: coordinates
              };
            });
            
            setEmergencies(transformedEmergencies);
            setLoading(false);
            return;
          }
        } 
        
        // No emergencies found
        setEmergencies([]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching emergencies:", error);
        setEmergencies([]);
        setLoading(false);
      }
    };
    
    fetchEmergencies();
    
    // Subscribe to real-time updates for emergency_responses
    const subscription = supabase
      .channel('emergency-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'emergency_responses',
        filter: `responder_id=eq.${user.id}`
      }, () => {
        fetchEmergencies();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, toast]);

  const handleAccept = async (id: string, emergencyResponseId?: string) => {
    try {
      if (!user) return;
      
      if (emergencyResponseId) {
        // Update the actual emergency response in Supabase
        const { error } = await supabase
          .from('emergency_responses')
          .update({ status: 'accepted' })
          .eq('id', emergencyResponseId);
          
        if (error) throw error;
        
        toast({
          title: "Emergency Accepted",
          description: "You have accepted this emergency call.",
        });
        
        // Update local state
        setEmergencies((prev) =>
          prev.map((emergency) =>
            emergency.id === id
              ? { ...emergency, status: "accepted" }
              : emergency
          )
        );
      }
    } catch (error) {
      console.error("Error accepting emergency:", error);
      toast({
        title: "Error",
        description: "Failed to accept emergency. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (id: string, emergencyResponseId?: string) => {
    try {
      if (!user) return;
      
      if (emergencyResponseId) {
        // Update the actual emergency response in Supabase
        const { error } = await supabase
          .from('emergency_responses')
          .update({ status: 'declined' })
          .eq('id', emergencyResponseId);
          
        if (error) throw error;
        
        toast({
          title: "Emergency Declined",
          description: "You have declined this emergency call.",
        });
        
        // Update local state
        setEmergencies((prev) =>
          prev.map((emergency) =>
            emergency.id === id
              ? { ...emergency, status: "declined" }
              : emergency
          )
        );
      }
    } catch (error) {
      console.error("Error declining emergency:", error);
      toast({
        title: "Error",
        description: "Failed to decline emergency. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to navigate to the patient's location
  const navigateToPatient = (emergency: Emergency) => {
    if (!emergency.coordinates) {
      toast({
        title: "Navigation Error",
        description: "Patient location not available",
        variant: "destructive",
      });
      return;
    }

    // Open Google Maps for directions in a new tab
    const { lat, lng } = emergency.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
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

        {loading ? (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-center items-center h-20">
              <div className="w-6 h-6 border-2 border-eresq-navy border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : emergencies.length === 0 ? (
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
                  📍 {emergency.location}
                </p>
                
                <p className="text-sm mb-3">{emergency.description}</p>
                
                {emergency.status === "new" ? (
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => handleAccept(emergency.id, emergency.emergencyResponseId)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md text-sm flex-grow mr-2"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(emergency.id, emergency.emergencyResponseId)}
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
                    <button 
                      onClick={() => navigateToPatient(emergency)}
                      className="flex items-center bg-eresq-navy text-white px-3 py-1 rounded-md text-sm"
                    >
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
