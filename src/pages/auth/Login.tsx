
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Phone, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'phone'>('google');
  const { signInWithOtp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!phoneNumber) {
        throw new Error('Please enter a phone number');
      }
      // Format phone number to E.164 format if necessary
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      await signInWithOtp(formattedPhone);
      
      // Store the phone number for the verification page
      sessionStorage.setItem('auth_identifier', formattedPhone);
      sessionStorage.setItem('auth_method', 'phone');
      
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${formattedPhone}`
      });
      
      // Redirect to verification page
      navigate('/auth/verify-otp');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send verification code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        throw error;
      }
      
      // The redirect to Google login happens automatically
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in with Google",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center text-eresq-navy">Welcome to eRESQ</h1>
        <p className="text-center text-gray-600 mb-6">
          Sign in or register to access emergency services and resources
        </p>
        
        <Tabs defaultValue="google" className="w-full" onValueChange={(value) => setAuthMethod(value as 'google' | 'phone')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="google">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </TabsTrigger>
            <TabsTrigger value="phone">
              <Phone className="mr-2 h-4 w-4" />
              Phone
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="google" className="mt-0">
            <div className="space-y-4">
              <Button 
                type="button" 
                onClick={handleGoogleSignIn} 
                className="w-full bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500">
                We'll use your Google account for authentication and profile information
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="phone" className="mt-0">
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number (with country code)" 
                />
                <p className="text-xs text-gray-500 mt-1">e.g., +1234567890 (include country code)</p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : "Send OTP"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LoginPage;
