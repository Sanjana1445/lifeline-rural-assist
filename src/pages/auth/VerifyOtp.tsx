
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState('');
  const { verifyOtp } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const phone = new URLSearchParams(location.search).get('phone');
  const email = new URLSearchParams(location.search).get('email');

  // Determine which authentication method we're using
  const isPhoneAuth = !!phone;
  const isEmailAuth = !!email;
  const contactInfo = phone || email || '';

  useEffect(() => {
    // If neither phone nor email is provided, redirect to login
    if (!isPhoneAuth && !isEmailAuth) {
      toast({
        title: "Error",
        description: "Missing contact information",
        variant: "destructive"
      });
      navigate('/auth/login');
    }
  }, [isPhoneAuth, isEmailAuth, navigate, toast]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo) {
      toast({
        title: "Error",
        description: "Contact information is missing",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isPhoneAuth) {
        await verifyOtp(contactInfo, otp);
      } else if (isEmailAuth) {
        await verifyOtp({ email: contactInfo, token: otp, type: 'email' });
      }
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
        <p className="text-center mb-6 text-gray-600">
          We've sent an OTP to {isPhoneAuth ? 'phone' : 'email'}: <strong>{contactInfo}</strong>
        </p>
        
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <Button type="submit" className="w-full">Verify</Button>
          
          <div className="text-center">
            <Button 
              type="button" 
              variant="link" 
              onClick={() => navigate('/auth/login')}
            >
              Back to Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
