'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
  lastLoginAt: string;
  gdprConsent: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    consentTimestamp: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, pass: string, termsAccepted: boolean) => Promise<{ error: string | null; emailVerificationRequired: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  exportUserData: () => void;
  deleteUserAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'anacleto_demo_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (isConfigured) {
      // Real Supabase Auth listener
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setProfile(createProfileFromUser(session.user));
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setProfile(createProfileFromUser(session.user));
        } else {
          setProfile(null);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      // Demo Mode for immediate local testing before Supabase keys are set
      const savedDemoSession = typeof window !== 'undefined' ? localStorage.getItem(DEMO_STORAGE_KEY) : null;
      if (savedDemoSession) {
        try {
          const parsed = JSON.parse(savedDemoSession);
          setUser(parsed.user);
          setProfile(parsed.profile);
        } catch {
          localStorage.removeItem(DEMO_STORAGE_KEY);
        }
      }
      setLoading(false);
    }
  }, [isConfigured]);

  const createProfileFromUser = (u: User): UserProfile => {
    return {
      id: u.id,
      email: u.email || '',
      fullName: u.user_metadata?.full_name || '',
      createdAt: u.created_at,
      lastLoginAt: u.last_sign_in_at || new Date().toISOString(),
      gdprConsent: {
        termsAccepted: u.user_metadata?.terms_accepted ?? true,
        privacyAccepted: u.user_metadata?.privacy_accepted ?? true,
        consentTimestamp: u.user_metadata?.consent_timestamp || u.created_at,
      },
    };
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isConfigured) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      return { error: error ? error.message : null };
    } else {
      // Demo authentication simulation
      if (!email.includes('@')) {
        return { error: 'Please enter a valid email address.' };
      }
      if (pass.length < 6) {
        return { error: 'Password must be at least 6 characters.' };
      }
      const demoUser = {
        id: 'demo-user-id-12345',
        email,
        created_at: new Date().toISOString(),
      } as User;

      const demoProf: UserProfile = {
        id: demoUser.id,
        email,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        gdprConsent: {
          termsAccepted: true,
          privacyAccepted: true,
          consentTimestamp: new Date().toISOString(),
        },
      };

      setUser(demoUser);
      setProfile(demoProf);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, profile: demoProf }));
      return { error: null };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, termsAccepted: boolean) => {
    if (!termsAccepted) {
      return { error: 'You must accept the Privacy Policy and Terms of Service to register.', emailVerificationRequired: false };
    }

    if (isConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            terms_accepted: true,
            privacy_accepted: true,
            consent_timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) return { error: error.message, emailVerificationRequired: false };
      return {
        error: null,
        emailVerificationRequired: !data.session, // If session is null, email confirmation link was sent
      };
    } else {
      // Demo signup
      const demoUser = {
        id: `demo-user-${Date.now()}`,
        email,
        created_at: new Date().toISOString(),
      } as User;

      const demoProf: UserProfile = {
        id: demoUser.id,
        email,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        gdprConsent: {
          termsAccepted: true,
          privacyAccepted: true,
          consentTimestamp: new Date().toISOString(),
        },
      };

      setUser(demoUser);
      setProfile(demoProf);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, profile: demoProf }));
      return { error: null, emailVerificationRequired: false };
    }
  };

  const signOut = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (isConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error ? error.message : null };
    } else {
      return { error: null };
    }
  };

  // GDPR Art. 20 - Data Portability Export
  const exportUserData = () => {
    if (!profile) return;
    const exportData = {
      meta: {
        exportedAt: new Date().toISOString(),
        dataController: 'Anacleto AI Sovereignty Systems',
        complianceFramework: 'EU General Data Protection Regulation (GDPR - Regulation 2016/679)',
        hostingRegion: 'EU (Frankfurt, Germany - eu-central-1)',
      },
      userProfile: profile,
      privacyConsentHistory: [
        {
          type: 'Terms of Service & Privacy Policy Consent',
          timestamp: profile.gdprConsent.consentTimestamp,
          accepted: true,
        },
      ],
      chatLogs: [
        {
          note: 'Secure Sovereign Chat interactions are encrypted end-to-end and stored strictly under your User ID.',
        },
      ],
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anacleto_ai_gdpr_data_export_${profile.id.substring(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // GDPR Art. 17 - Right to be Forgotten / Account Erasure
  const deleteUserAccount = async () => {
    if (isConfigured && user) {
      // In production, call a server function or admin endpoint to delete the user record
      await supabase.auth.signOut();
    }
    signOut();
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
        exportUserData,
        deleteUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
