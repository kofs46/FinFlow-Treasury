import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) setProfile(data);
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password, fullName, recoveryPin) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) return { error };

    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        recovery_pin: recoveryPin,
        preferred_language: 'bn'
      });
    }
    return { data };
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);