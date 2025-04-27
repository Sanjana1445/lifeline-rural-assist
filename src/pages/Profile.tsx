import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<{
    full_name?: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, email, address')
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

    fetchProfile();
  }, [user, toast]);

  const handleLogout = async () => {
    await logout();
  };

  if (!profile) return null;

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

        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="font-medium text-lg mb-4">Settings</h2>
          
          <div className="mt-4 space-y-3">
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
