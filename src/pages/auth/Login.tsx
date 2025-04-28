
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowRight } from "lucide-react";

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const { signInWithOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMethod === 'phone') {
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
      } else {
        await signInWithOtp({ email });
        
        // Store the email for the verification page
        sessionStorage.setItem('auth_identifier', email);
        sessionStorage.setItem('auth_method', 'email');
        
        toast({
          title: "OTP Sent",
          description: `A verification code has been sent to ${email}`
        });
        
        // Redirect to verification page
        navigate('/auth/verify-otp');
      }
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

  const handleSkipAuth = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-gray-50">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" onClick={handleSkipAuth}>
          Skip <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      
      <div className="max-w-md w-full mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center text-eresq-navy">Sign In / Register</h1>
        
        <Tabs defaultValue="phone" className="w-full" onValueChange={(value) => setAuthMethod(value as 'phone' | 'email')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="phone">
              <Phone className="mr-2 h-4 w-4" />
              Phone
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="phone" className="mt-0">
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number (with country code)" 
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="email" className="mt-0">
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address" 
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LoginPage;
