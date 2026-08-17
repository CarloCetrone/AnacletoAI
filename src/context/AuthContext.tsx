'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  accountType: 'standard' | 'developer' | 'enterprise';
  username?: string;
  enterpriseName?: string;
  enterpriseId?: string;
  creditLimit?: number;
  createdAt: string;
  lastLoginAt: string;
  gdprConsent: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    consentTimestamp: string;
  };
}

export interface ApiKeyItem {
  id: string;
  userId: string;
  keyName: string;
  keyValue: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastUsedAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, pass: string, termsAccepted: boolean, accountType: 'standard' | 'developer' | 'enterprise', username?: string, enterpriseName?: string) => Promise<{ error: string | null; emailVerificationRequired: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateAccountType: (newType: 'standard' | 'developer' | 'enterprise') => Promise<{ error: string | null }>;
  exportUserData: () => void;
  deleteUserAccount: () => Promise<{ error: string | null }>;
  fetchApiKeys: () => Promise<{ data: ApiKeyItem[]; error: string | null }>;
  createApiKey: (keyName: string) => Promise<{ data: ApiKeyItem | null; error: string | null }>;
  toggleApiKeyStatus: (keyId: string, currentStatus: 'active' | 'disabled') => Promise<{ error: string | null }>;
  deleteApiKey: (keyId: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'anacleto_demo_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  const fetchProfile = async (u: User): Promise<UserProfile> => {
    if (!isConfigured) return createDemoProfile(u);
    
    const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    
    if (data) {
      return {
        id: u.id,
        email: u.email || '',
        fullName: u.user_metadata?.full_name || '',
        accountType: data.account_type,
        username: data.username,
        enterpriseName: data.enterprise_name,
        enterpriseId: data.enterprise_id,
        creditLimit: data.credit_limit,
        createdAt: data.created_at || u.created_at,
        lastLoginAt: u.last_sign_in_at || new Date().toISOString(),
        gdprConsent: {
          termsAccepted: u.user_metadata?.terms_accepted ?? true,
          privacyAccepted: u.user_metadata?.privacy_accepted ?? true,
          consentTimestamp: u.user_metadata?.consent_timestamp || u.created_at,
        },
      };
    }

    // Fallback if not found yet (e.g. before trigger finishes)
    return {
      id: u.id,
      email: u.email || '',
      accountType: (u.user_metadata?.account_type as any) || 'standard',
      username: u.user_metadata?.username,
      enterpriseName: u.user_metadata?.enterprise_name,
      createdAt: u.created_at,
      lastLoginAt: new Date().toISOString(),
      gdprConsent: { termsAccepted: true, privacyAccepted: true, consentTimestamp: u.created_at }
    };
  };

  useEffect(() => {
    if (isConfigured) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setProfile(await fetchProfile(session.user));
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setProfile(await fetchProfile(session.user));
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

  const createDemoProfile = (u: User): UserProfile => {
    return {
      id: u.id,
      email: u.email || '',
      fullName: u.user_metadata?.full_name || '',
      accountType: (u.user_metadata?.account_type as 'standard' | 'developer' | 'enterprise') || 'standard',
      username: u.user_metadata?.username,
      enterpriseName: u.user_metadata?.enterprise_name,
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
        accountType: 'standard', // Default for demo signIn unless previously saved
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        gdprConsent: {
          termsAccepted: true,
          privacyAccepted: true,
          consentTimestamp: new Date().toISOString(),
        },
      };

      // Try to load accountType from previous demo save if it exists
      const savedDemoSession = localStorage.getItem(DEMO_STORAGE_KEY);
      if (savedDemoSession) {
        try {
          const parsed = JSON.parse(savedDemoSession);
          if (parsed.profile?.accountType) {
            demoProf.accountType = parsed.profile.accountType;
          }
        } catch {}
      }

      setUser(demoUser);
      setProfile(demoProf);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, profile: demoProf }));
      return { error: null };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, termsAccepted: boolean, accountType: 'standard' | 'developer' | 'enterprise', username?: string, enterpriseName?: string) => {
    if (!termsAccepted) {
      return { error: 'You must accept the Privacy Policy and Terms of Service to register.', emailVerificationRequired: false };
    }

    if (isConfigured) {
      // Validate unique username before Auth flow
      if (accountType !== 'enterprise' && username) {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('username', username);
        if (count && count > 0) return { error: 'Username is already taken.', emailVerificationRequired: false };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            account_type: accountType,
            username: accountType === 'enterprise' ? null : username,
            enterprise_name: accountType === 'enterprise' ? enterpriseName : null,
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
        accountType,
        username,
        enterpriseName,
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

  const updateAccountType = async (newType: 'standard' | 'developer' | 'enterprise') => {
    if (isConfigured && user) {
      const { data, error } = await supabase.auth.updateUser({
        data: { account_type: newType }
      });
      if (error) return { error: error.message };
      
      // Also update profiles table
      await supabase.from('profiles').update({ account_type: newType }).eq('id', user.id);

      if (data.user) {
        setProfile(await fetchProfile(data.user));
      }
      return { error: null };
    } else if (profile && user) {
      // Demo update
      const updatedProf = { ...profile, accountType: newType };
      setProfile(updatedProf);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user, profile: updatedProf }));
      return { error: null };
    }
    return { error: 'Not authenticated' };
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
      // Call a Postgres function with SECURITY DEFINER to delete the auth.users record
      const { error } = await supabase.rpc('delete_user');
      if (error) {
        console.error('Failed to delete user:', error);
        return { error: error.message || 'Failed to delete user, RPC missing.' };
      }
      await supabase.auth.signOut();
    }
    await signOut();
    return { error: null };
  };

  // --- API KEY MANAGEMENT METHODS ---
  const DEMO_KEYS_STORAGE_KEY = 'anacleto_demo_api_keys';

  const fetchApiKeys = async (): Promise<{ data: ApiKeyItem[]; error: string | null }> => {
    if (!user) return { data: [], error: 'Not authenticated' };

    if (isConfigured) {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) return { data: [], error: error.message };
      
      const mapped: ApiKeyItem[] = (data || []).map((k: any) => ({
        id: k.id,
        userId: k.user_id,
        keyName: k.key_name || k.name || k.label || 'API Secret',
        keyValue: k.key_value || k.key || k.value || '',
        status: (k.status as 'active' | 'disabled') || 'active',
        createdAt: k.created_at || new Date().toISOString(),
        lastUsedAt: k.last_used_at,
      }));

      return { data: mapped, error: null };
    } else {
      // Demo storage fallback
      const savedKeys = localStorage.getItem(DEMO_KEYS_STORAGE_KEY);
      if (savedKeys) {
        try {
          const parsed = JSON.parse(savedKeys) as ApiKeyItem[];
          return { data: parsed.filter(k => k.userId === user.id), error: null };
        } catch {}
      }
      // Initial demo key
      const initialDemoKey: ApiKeyItem = {
        id: 'demo-key-1',
        userId: user.id,
        keyName: 'Default Production Secret',
        keyValue: `anc_live_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 8)}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      };
      localStorage.setItem(DEMO_KEYS_STORAGE_KEY, JSON.stringify([initialDemoKey]));
      return { data: [initialDemoKey], error: null };
    }
  };

  const createApiKey = async (keyName: string): Promise<{ data: ApiKeyItem | null; error: string | null }> => {
    if (!user) return { data: null, error: 'Not authenticated' };

    // Generate random anc_live_ key string
    const randomBytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKeyValue = `anc_live_${randomBytes}`;

    if (isConfigured) {
      // Try inserting with key_name first
      let { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          key_name: keyName || 'API Secret',
          key_value: newKeyValue,
          status: 'active'
        })
        .select()
        .single();

      // If key_name column is missing in schema cache, try inserting with 'name' column
      if (error && (error.message.includes('key_name') || error.message.includes('schema cache'))) {
        const fallback = await supabase
          .from('api_keys')
          .insert({
            user_id: user.id,
            name: keyName || 'API Secret',
            key_value: newKeyValue,
            status: 'active'
          })
          .select()
          .single();
        
        data = fallback.data;
        error = fallback.error;
      }

      if (error) return { data: null, error: error.message };

      const item: ApiKeyItem = {
        id: data.id,
        userId: data.user_id,
        keyName: data.key_name || data.name || keyName || 'API Secret',
        keyValue: data.key_value || data.key || newKeyValue,
        status: data.status || 'active',
        createdAt: data.created_at || new Date().toISOString(),
        lastUsedAt: data.last_used_at,
      };

      return { data: item, error: null };
    } else {
      // Demo mode insertion
      const newKey: ApiKeyItem = {
        id: `demo-key-${Date.now()}`,
        userId: user.id,
        keyName: keyName || 'API Secret',
        keyValue: newKeyValue,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      };

      const existingStr = localStorage.getItem(DEMO_KEYS_STORAGE_KEY);
      let existingList: ApiKeyItem[] = [];
      if (existingStr) {
        try { existingList = JSON.parse(existingStr); } catch {}
      }
      existingList.unshift(newKey);
      localStorage.setItem(DEMO_KEYS_STORAGE_KEY, JSON.stringify(existingList));

      return { data: newKey, error: null };
    }
  };

  const toggleApiKeyStatus = async (keyId: string, currentStatus: 'active' | 'disabled'): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';

    if (isConfigured) {
      const { error } = await supabase
        .from('api_keys')
        .update({ status: nextStatus })
        .eq('id', keyId)
        .eq('user_id', user.id);

      if (error) return { error: error.message };
      return { error: null };
    } else {
      // Demo update
      const existingStr = localStorage.getItem(DEMO_KEYS_STORAGE_KEY);
      if (existingStr) {
        try {
          const list: ApiKeyItem[] = JSON.parse(existingStr);
          const updated = list.map(k => k.id === keyId ? { ...k, status: nextStatus } : k);
          localStorage.setItem(DEMO_KEYS_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
      return { error: null };
    }
  };

  const deleteApiKey = async (keyId: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    if (isConfigured) {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', user.id);

      if (error) return { error: error.message };
      return { error: null };
    } else {
      // Demo delete
      const existingStr = localStorage.getItem(DEMO_KEYS_STORAGE_KEY);
      if (existingStr) {
        try {
          const list: ApiKeyItem[] = JSON.parse(existingStr);
          const filtered = list.filter(k => k.id !== keyId);
          localStorage.setItem(DEMO_KEYS_STORAGE_KEY, JSON.stringify(filtered));
        } catch {}
      }
      return { error: null };
    }
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
        updateAccountType,
        exportUserData,
        deleteUserAccount,
        fetchApiKeys,
        createApiKey,
        toggleApiKeyStatus,
        deleteApiKey,
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
