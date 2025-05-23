import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CompleteProfilePage = () => {
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tempEmail, setTempEmail] = useState<string | null>(null);
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for temporary email from direct email login
    const storedTempEmail = sessionStorage.getItem('tempEmail');
    if (storedTempEmail) {
      setTempEmail(storedTempEmail);
    } else if (!user && !localStorage.getItem('authenticated')) {
      // If no user and no temp email, redirect to login
      navigate('/auth/login');
      return;
    }
    
    // Pre-fill name if available from OAuth provider or metadata
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }

    // Fetch existing profile data if available
    const fetchProfile = async () => {
      if (!user && !storedTempEmail) return;
      
      try {
        let query;
        
        if (user) {
          query = supabase
            .from('profiles')
            .select('full_name, address')
            .eq('id', user.id)
            .single();
        } else if (storedTempEmail) {
          query = supabase
            .from('profiles')
            .select('full_name, address')
            .eq('email', storedTempEmail)
            .single();
        }
          
        if (query) {
          const { data } = await query;
          if (data) {
            if (data.full_name) setFullName(data.full_name);
            if (data.address) setAddress(data.address);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    
    fetchProfile();
  }, [user, navigate]);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!fullName.trim()) {
        throw new Error("Please enter your full name");
      }

      if (!address.trim()) {
        throw new Error("Please enter your address");
      }

      console.log("Updating profile with data:", { full_name: fullName, address: address, email: tempEmail || undefined });
      
      // Update profile with required fields
      await updateProfile({
        full_name: fullName,
        address: address,
        email: tempEmail || undefined
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated"
      });

      navigate('/');
    } catch (error) {
      console.error("Profile update error:", error);
      
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // If it's a Supabase error object
      if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      
      toast({
        title: "Error Updating Profile",
        description: errorMessage,
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
