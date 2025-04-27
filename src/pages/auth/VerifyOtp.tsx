
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState('');
  const { verifyOtp } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const phone = new URLSearchParams(location.search).get('phone');

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast({
        title: "Error",
        description: "Phone number is missing",
        variant: "destructive"
      });
      return;
    }

    try {
      await verifyOtp(phone, otp);
    } catch (error) {
      toast({
        title: "Invalid OTP",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Verify OTP</h1>
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <Input 
            type="text" 
            placeholder="Enter 6-digit OTP" 
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required 
          />
          <Button type="submit" className="w-full">Verify</Button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
