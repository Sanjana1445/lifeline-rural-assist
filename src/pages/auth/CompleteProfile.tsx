
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const CompleteProfilePage = () => {
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        full_name: fullName,
        address,
        email: email || undefined
      });

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
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h1>
        <form onSubmit={handleCompleteProfile} className="space-y-4">
          <Input 
            type="text" 
            placeholder="Full Name" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required 
          />
          <Input 
            type="text" 
            placeholder="Address" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required 
          />
          <Input 
            type="email" 
            placeholder="Email (Optional)" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" className="w-full">Save Profile</Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
