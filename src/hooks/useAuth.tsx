
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);

      // If no user, redirect to login
      if (!session?.user) {
        navigate('/auth/login');
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      // If logged out, redirect to login
      if (event === 'SIGNED_OUT') {
        navigate('/auth/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Function to sign in with OTP via phone or email
  const signInWithOtp = async (phoneOrEmail: string | { email: string }) => {
    setLoading(true);
    try {
      let response;
      
      if (typeof phoneOrEmail === 'string') {
        // Handle phone OTP
        const formattedPhone = phoneOrEmail.startsWith('+') ? phoneOrEmail : `+${phoneOrEmail}`;
        response = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });
      } else {
        // Handle email OTP
        response = await supabase.auth.signInWithOtp({
          email: phoneOrEmail.email,
        });
      }
      
      if (response.error) {
        throw response.error;
      }
      
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to verify OTP for both phone and email
  const verifyOtp = async (
    phoneOrEmail: string | { email: string, token: string, type: 'email' }, 
    token?: string
  ) => {
    setLoading(true);
    try {
      let response;
      
      if (typeof phoneOrEmail === 'string' && token) {
        // Handle phone verification
        const formattedPhone = phoneOrEmail.startsWith('+') ? phoneOrEmail : `+${phoneOrEmail}`;
        response = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token,
          type: 'sms'
        });
      } else if (typeof phoneOrEmail === 'object') {
        // Handle email verification
        response = await supabase.auth.verifyOtp({
          email: phoneOrEmail.email,
          token: phoneOrEmail.token,
          type: phoneOrEmail.type
        });
      } else {
        throw new Error('Invalid verification parameters');
      }
      
      if (response.error) {
        throw response.error;
      }

      // Navigate to profile completion if new user
      if (response.data.session?.user) {
        navigate('/auth/complete-profile');
      }
      
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: {
    full_name?: string;
    address?: string;
    email?: string;
  }) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id);

    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    loading,
    signInWithOtp,
    verifyOtp,
    updateProfile,
    logout
  };
};
