
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithOtp: (phoneOrEmail: string | { email: string }) => Promise<any>;
  verifyOtp: (phoneOrEmail: string | { email: string; token: string; type: 'email' }, token?: string) => Promise<any>;
  updateProfile: (profileData: { full_name?: string; address?: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      // Handle auth events
      if (event === 'SIGNED_IN') {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // If user just signed in with OAuth, redirect to complete profile
        if (currentSession?.user?.app_metadata?.provider 
            && currentSession.user.app_metadata.provider !== 'phone' 
            && !event.startsWith('TOKEN_')) {
          setTimeout(() => navigate('/auth/complete-profile'), 0);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    });
    
    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signInWithOtp = async (phoneOrEmail: string | { email: string }) => {
    setLoading(true);
    try {
      let response;
      
      if (typeof phoneOrEmail === 'string') {
        // Format phone number to E.164 format (required by Supabase)
        const formattedPhone = phoneOrEmail.startsWith('+') ? phoneOrEmail : `+${phoneOrEmail}`;
        
        response = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });
      } else {
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

  const verifyOtp = async (
    phoneOrEmail: string | { email: string, token: string, type: 'email' }, 
    token?: string
  ) => {
    setLoading(true);
    try {
      let response;
      
      if (typeof phoneOrEmail === 'string' && token) {
        const formattedPhone = phoneOrEmail.startsWith('+') ? phoneOrEmail : `+${phoneOrEmail}`;
        
        response = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token,
          type: 'sms'
        });
      } else if (typeof phoneOrEmail === 'object') {
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
      
      // If verification is successful, navigate to complete profile
      if (response.data.user) {
        navigate('/auth/complete-profile');
      } else {
        navigate('/');
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
    navigate('/auth/login');
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        session,
        loading,
        signInWithOtp,
        verifyOtp,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
