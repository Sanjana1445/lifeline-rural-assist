
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { signInWithOtp, directEmailLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check for error parameters in URL
  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      toast({
        title: "Authentication Error",
        description: errorDescription || "There was an error during authentication. Please try again.",
        variant: "destructive"
      });
      
      // Clear error from URL
      navigate('/auth/login', { replace: true });
    }
  }, [searchParams, toast, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (localStorage.getItem('authenticated')) {
      navigate('/');
    }
  }, [navigate]);

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email) {
        throw new Error('Please enter an email address');
      }
      
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      // Direct email login without verification
      await directEmailLogin(email);
      
      toast({
        title: "Login Successful",
        description: "You will now be redirected to complete your profile"
      });
      
      // Redirect to complete profile page
      navigate('/auth/complete-profile');
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to log in with email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipLogin = async () => {
    try {
      setIsLoading(true);
      
      // Generate random email to avoid conflicts
      const randomEmail = `guest_${Math.random().toString(36).substring(2, 10)}@example.com`;
      
      // Attempt to create a guest profile
      await directEmailLogin(randomEmail);
      
      // Create dummy profile data in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: (await supabase.auth.getUser()).data.user?.id,
          email: randomEmail,
          full_name: 'Guest User',
          address: '123 Example St, Anytown, USA',
          created_at: new Date().toISOString()
        });
        
      if (profileError) {
        console.error('Error creating guest profile:', profileError);
      }
      
      // Set authenticated flag in localStorage
      localStorage.setItem('authenticated', 'true');
      
      toast({
        title: "Guest Access Granted",
        description: "You are now browsing as a guest user"
      });
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create guest account. Please try again.",
        variant: "destructive"
      });
      console.error('Skip login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        {/* Skip button */}
        <div className="flex justify-end mb-4">
          <Button 
            variant="ghost" 
            onClick={handleSkipLogin} 
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-800 flex items-center gap-1"
          >
            Skip
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-center mb-6">
          <h1 className="text-2xl font-bold text-eresq-navy">eRESQ</h1>
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center text-eresq-navy">Welcome to eRESQ</h1>
        <p className="text-center text-gray-600 mb-6">
          Sign in or register to access emergency services and resources
        </p>
        
        <Tabs defaultValue="email" className="w-full" onValueChange={(value) => setAuthMethod(value as 'email' | 'phone')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="phone">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              Phone
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="mt-0">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address" 
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : "Continue with Email"}
              </Button>
              <p className="text-xs text-center text-gray-500">
                No verification required. You'll be asked to provide your details on the next screen.
              </p>
            </form>
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
