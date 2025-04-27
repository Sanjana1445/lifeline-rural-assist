
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

  const signInWithOtp = async (phone: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    return data;
  };

  const verifyOtp = async (phone: string, token: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
      token,
      type: 'sms'
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    // Navigate to profile completion if new user
    if (data.session?.user) {
      navigate('/auth/complete-profile');
    }

    setLoading(false);
    return data;
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
