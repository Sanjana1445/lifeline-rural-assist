
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from "lucide-react";

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const { verifyOtp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (user) {
      navigate('/');
      return;
    }

    // Retrieve stored identifier and auth method
    const storedIdentifier = sessionStorage.getItem('auth_identifier');
    const storedAuthMethod = sessionStorage.getItem('auth_method') as 'phone' | 'email';
    
    if (!storedIdentifier) {
      // If no identifier is found, redirect to login page
      toast({
        title: "Error",
        description: "No verification in progress. Please sign in again.",
        variant: "destructive"
      });
      navigate('/auth/login');
      return;
    }
    
    setIdentifier(storedIdentifier);
    if (storedAuthMethod) {
      setAuthMethod(storedAuthMethod);
    }
  }, [navigate, toast, user]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      if (authMethod === 'phone') {
        await verifyOtp(identifier, otp);
      } else {
        await verifyOtp({ 
          email: identifier, 
          token: otp,
          type: 'email'
        });
      }
      
      // Clear stored values
      sessionStorage.removeItem('auth_identifier');
      sessionStorage.removeItem('auth_method');
      
      toast({
        title: "Success",
        description: "Verification successful!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const maskedIdentifier = authMethod === 'phone' 
    ? `${identifier.slice(0, 3)}****${identifier.slice(-3)}` 
    : identifier.includes('@') 
      ? `${identifier.slice(0, 2)}***@${identifier.split('@')[1]}` 
      : identifier;

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-center text-eresq-navy">Verify OTP</h1>
        <p className="text-center text-gray-600 mb-6">
          Enter the verification code sent to {maskedIdentifier}
        </p>
        
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <Input 
              type="text" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter verification code" 
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : "Verify OTP"}
          </Button>
          <div className="text-center">
            <Button 
              type="button" 
              variant="ghost" 
              className="text-sm text-gray-600 flex items-center justify-center"
              onClick={() => navigate('/auth/login')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Sign In
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
