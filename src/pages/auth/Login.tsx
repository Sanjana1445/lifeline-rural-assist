
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Mail, Phone } from "lucide-react";

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const { signInWithOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithOtp(phone);
      // Navigate to the verify OTP page with the phone number in the URL
      navigate(`/auth/verify-otp?phone=${encodeURIComponent(phone)}`);
    } catch (error) {
      toast({
        title: "Error Sending OTP",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithOtp({ email });
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code",
      });
      // Navigate to verify OTP page with email parameter
      navigate(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
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
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        
        <Tabs defaultValue="phone" className="w-full">
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
          
          <TabsContent value="phone">
            <form onSubmit={handleSendPhoneOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone"
                  type="tel" 
                  placeholder="Enter your phone number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required 
                />
                <p className="text-xs text-gray-500">Format: +91XXXXXXXXXX or 91XXXXXXXXXX</p>
              </div>
              <Button type="submit" className="w-full">Send OTP</Button>
            </form>
          </TabsContent>
          
          <TabsContent value="email">
            <form onSubmit={handleSendEmailOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full">Send OTP</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LoginPage;
