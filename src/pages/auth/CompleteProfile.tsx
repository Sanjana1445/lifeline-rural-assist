
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";

const CompleteProfilePage = () => {
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, session, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user) {
      navigate('/auth/login');
      return;
    }
    
    // Pre-fill name if available from OAuth provider
    if (user.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user, navigate]);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!fullName.trim()) {
        throw new Error("Please enter your full name");
      }

      // Only update fields that are provided and relevant
      const profileData: { full_name: string; address?: string } = {
        full_name: fullName,
      };

      if (address.trim()) {
        profileData.address = address;
      }

      await updateProfile(profileData);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated"
      });

      navigate('/');
    } catch (error) {
      toast({
        title: "Error Updating Profile",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-center text-eresq-navy">Complete Your Profile</h1>
        <p className="text-center text-gray-600 mb-6">
          Please provide some additional information to set up your account
        </p>
        
        <form onSubmit={handleCompleteProfile} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <Input 
              id="fullName"
              type="text" 
              placeholder="Full Name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
            />
          </div>
          
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input 
              id="address"
              type="text" 
              placeholder="Address" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required 
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : "Save Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
