
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";

interface Emergency {
  id: string;
  created_at: string;
  description: string;
  status: string;
}

const History = () => {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchEmergencyHistory = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('emergencies')
          .select('*')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setEmergencies(data || []);
      } catch (error) {
        console.error('Error fetching emergency history:', error);
        toast({
          title: "Error",
          description: "Failed to load emergency history",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencyHistory();
  }, [user, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleFollowUp = () => {
    toast({
      title: "Follow Up",
      description: "This feature is not available yet."
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <h1 className="text-xl font-bold mb-4">Emergency History</h1>

        {loading ? (
          <div className="bg-white rounded-lg p-6 shadow-sm flex justify-center">
            <div className="w-6 h-6 border-2 border-eresq-navy border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : emergencies.length > 0 ? (
          <div className="space-y-4">
            {emergencies.map((emergency) => (
              <div key={emergency.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <AlertTriangle className="text-eresq-red mr-2" size={18} />
                    <h2 className="font-medium">Emergency Alert</h2>
                  </div>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock size={14} className="mr-1" />
                    {formatDate(emergency.created_at)}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-3">{emergency.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    emergency.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : 
                    emergency.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    'bg-eresq-red bg-opacity-10 text-eresq-red'
                  }`}>
                    {emergency.status === 'cancelled' ? 'Cancelled' : 
                     emergency.status === 'completed' ? 'Completed' : 
                     'Emergency'}
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleFollowUp}
                  >
                    Follow Up
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <p className="text-gray-600">No emergency history found.</p>
          </div>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};

export default History;
