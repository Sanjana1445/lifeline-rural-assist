
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { useToast } from "@/hooks/use-toast";
import { User, Users } from "lucide-react";

interface FrontlineType {
  id: number;
  name: string;
  description: string | null;
}

const Profile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<{
    full_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    is_frontline_worker?: boolean;
    frontline_type?: number;
  } | null>(null);
  const [frontlineTypes, setFrontlineTypes] = useState<FrontlineType[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, email, address, is_frontline_worker, frontline_type')
        .eq('id', user.id)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Could not fetch profile",
          variant: "destructive"
        });
        return;
      }

      setProfile(data);
    };

    const fetchFrontlineTypes = async () => {
      const { data, error } = await supabase
        .from('frontline_types')
        .select('*')
        .order('name');

      if (error) {
        console.error("Error fetching frontline types:", error);
        return;
      }

      setFrontlineTypes(data || []);
    };

    fetchProfile();
    fetchFrontlineTypes();
  }, [user, toast]);

  const handleLogout = async () => {
    await logout();
  };

  const handleRegisterFrontline = () => {
    navigate('/frontline-registration');
  };

  if (!profile) return null;

  const frontlineTypeName = profile.frontline_type 
    ? frontlineTypes.find(type => type.id === profile.frontline_type)?.name 
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <h1 className="text-xl font-bold mb-4">Profile</h1>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="font-medium text-lg mb-4">Personal Information</h2>
          
          <div className="mb-4">
            <label className="block text-gray-500 text-sm mb-1">Name</label>
            <p className="font-medium">{profile.full_name || 'Not set'}</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-500 text-sm mb-1">Phone</label>
            <p className="font-medium">{profile.phone}</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-500 text-sm mb-1">Email</label>
            <p className="font-medium">{profile.email || 'Not set'}</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-500 text-sm mb-1">Address</label>
            <p className="font-medium">{profile.address || 'Not set'}</p>
          </div>
        </div>

        {profile.is_frontline_worker && frontlineTypeName && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-eresq-navy" size={20} />
              <h2 className="font-medium text-lg">Frontline Worker Status</h2>
            </div>
            <div className="bg-eresq-navy bg-opacity-10 p-3 rounded-md">
              <p className="text-sm">You are registered as a:</p>
              <p className="font-bold text-eresq-navy">{frontlineTypeName}</p>
            </div>
            <Button 
              className="mt-3 w-full"
              onClick={() => navigate('/frontline-dashboard')}
            >
              Access Frontline Dashboard
            </Button>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="font-medium text-lg mb-4">Settings</h2>
          
          <div className="mt-4 space-y-3">
            {!profile.is_frontline_worker && (
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={handleRegisterFrontline}
              >
                <Users size={18} />
                Register as Frontline Worker
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {/* TODO: Implement edit profile */}}
            >
              Edit Profile
            </Button>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default Profile;
