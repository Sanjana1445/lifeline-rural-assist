
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const { signInWithOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithOtp(phone);
      navigate(`/auth/verify-otp?phone=${encodeURIComponent(phone)}`);
    } catch (error) {
      toast({
        title: "Error Sending OTP",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Login with Phone</h1>
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Input 
            type="tel" 
            placeholder="Enter your phone number" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required 
          />
          <Button type="submit" className="w-full">Send OTP</Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
