import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Atom, Check, AlertCircle, Info, Lock, Mail, KeyRound, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PrivacyPolicyModal } from '@/components/PrivacyPolicyModal';

interface LoginViewProps {
  onNavigate: (view: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const { signInWithEmail, signUpWithEmail, resetPassword, isConfigured } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // GDPR Consent Checkboxes (Must NOT be pre-checked under GDPR Art. 7)
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // User Account Type for RBAC
  const [accountType, setAccountType] = useState<'standard' | 'developer' | 'enterprise' | 'creator' | 'educator'>('standard');
  const [username, setUsername] = useState('');
  const [enterpriseName, setEnterpriseName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // Password Strength Calculator
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passStrength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      if (accountType !== 'enterprise' && !username.trim()) {
        setErrorMsg('Username is required.');
        return;
      }
      if (accountType === 'enterprise' && !enterpriseName.trim()) {
        setErrorMsg('Enterprise Name is required.');
        return;
      }
      if (!acceptedTerms) {
        setErrorMsg('Under EU GDPR rules, you must accept the Terms of Service & Privacy Policy to create an account.');
        return;
      }

      setLoading(true);
      const res = await signUpWithEmail(email, password, acceptedTerms, accountType, username, enterpriseName);
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.emailVerificationRequired) {
        setSuccessMsg('Account registration initiated! Please check your email to verify your address before signing in.');
        setMode('signin');
      } else {
        onNavigate('chat');
      }
    } else if (mode === 'signin') {
      setLoading(true);
      const res = await signInWithEmail(email, password);
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        onNavigate('chat');
      }
    } else if (mode === 'forgot') {
      setLoading(true);
      const res = await resetPassword(email);
      setLoading(false);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Password reset instructions have been dispatched to your email.');
        setMode('signin');
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 relative">
      {/* Background Ambient Glow */}
      <div className="absolute w-96 h-96 bg-[#FFD54F]/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#1A1A1A] border border-[#333333] rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        
        {/* Supabase Status Banner */}
        {!isConfigured && (
          <div className="mb-6 p-3 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/30 text-xs text-[#FFD54F] flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-[#F5F5F5]">Demo Auth Mode Active</strong>
              Supabase environment variables (`NEXT_PUBLIC_SUPABASE_URL`) not set yet. You can sign in/up with any email to test the workflow locally!
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 text-[#FFD54F] mb-3">
            <Atom className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-tight uppercase">
            {mode === 'signin' && 'Access Anacleto AI'}
            {mode === 'signup' && 'Create Sovereign Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p className="text-[#BDBDBD] text-xs sm:text-sm mt-1">
            {mode === 'signin' && 'Sign in to access secure sovereign chat & API models'}
            {mode === 'signup' && 'Register under EU GDPR data protection compliance'}
            {mode === 'forgot' && 'We will send a password reset link to your email'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        {mode !== 'forgot' && (
          <div className="flex bg-[#121212] p-1 rounded-xl border border-[#333333] mb-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                mode === 'signin' ? 'bg-[#FFD54F] text-black shadow' : 'text-[#BDBDBD] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                mode === 'signup' ? 'bg-[#FFD54F] text-black shadow' : 'text-[#BDBDBD] hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Account Type Selection (Sign Up Mode) */}
          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-2">
                Select Account Type
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as 'standard' | 'developer' | 'enterprise' | 'creator' | 'educator')}
                className="w-full px-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] text-sm font-semibold focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all appearance-none cursor-pointer"
              >
                <option value="standard">Standard User</option>
                <option value="developer">Developer</option>
                <option value="creator">Creator</option>
                <option value="educator">Educator</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          )}

          {/* Dynamic Sign Up Fields */}
          {mode === 'signup' && accountType !== 'enterprise' && (
            <div>
              <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="unique_username"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all"
                />
                <User className="w-4 h-4 text-[#666666] absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          {mode === 'signup' && accountType === 'enterprise' && (
            <div>
              <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-2">
                Enterprise Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={enterpriseName}
                  onChange={(e) => setEnterpriseName(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all"
                />
                <ShieldCheck className="w-4 h-4 text-[#666666] absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-2">
              Work Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all"
              />
              <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-3.5" />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(null); }}
                    className="text-xs text-[#FFD54F] hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all"
                />
                <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-3.5" />
              </div>

              {/* Password Strength Meter (Sign Up Mode) */}
              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1.5 w-full bg-[#121212] rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${passStrength >= 1 ? 'bg-red-500 w-1/4' : 'w-0'}`} />
                    <div className={`h-full transition-all ${passStrength >= 2 ? 'bg-orange-500 w-1/4' : 'w-0'}`} />
                    <div className={`h-full transition-all ${passStrength >= 3 ? 'bg-yellow-400 w-1/4' : 'w-0'}`} />
                    <div className={`h-full transition-all ${passStrength >= 4 ? 'bg-emerald-400 w-1/4' : 'w-0'}`} />
                  </div>
                  <span className="text-[10px] text-[#BDBDBD] block text-right font-medium">
                    {passStrength <= 1 && 'Weak Password'}
                    {passStrength === 2 && 'Fair Password'}
                    {passStrength === 3 && 'Good Password'}
                    {passStrength >= 4 && 'Strong Bank-Grade Password'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password (Sign Up Mode) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all"
                />
                <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          {/* GDPR Explicit Consent Checkboxes (Sign Up Mode) */}
          {mode === 'signup' && (
            <div className="pt-2 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded bg-[#121212] border-[#333333] text-[#FFD54F] focus:ring-[#FFD54F] focus:ring-offset-0"
                />
                <span className="text-xs text-[#BDBDBD] leading-tight">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setPrivacyModalOpen(true)}
                    className="text-[#FFD54F] underline hover:text-white"
                  >
                    Terms of Service
                  </button>{' '}
                  and acknowledge the{' '}
                  <button
                    type="button"
                    onClick={() => setPrivacyModalOpen(true)}
                    className="text-[#FFD54F] underline hover:text-white"
                  >
                    GDPR Privacy Policy
                  </button>
                  . (EU Data Center Frankfurt, Germany).
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-md shadow-[#FFD54F]/20 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'signin' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Link'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => setMode('signin')}
            className="w-full mt-4 text-xs text-[#BDBDBD] hover:text-[#FFD54F] transition-colors text-center block"
          >
            ← Back to Sign In
          </button>
        )}

        {/* SSO Button */}
        {mode === 'signin' && (
          <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#333333]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1A1A1A] px-3 text-[#666666] font-semibold tracking-wider">
                  OR
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('chat')}
              className="w-full py-3 px-4 rounded-lg border border-[#333333] bg-[#121212] hover:bg-[#252525] text-[#F5F5F5] font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2.5"
            >
              <KeyRound className="w-4 h-4 text-[#FFD54F]" />
              Enterprise SSO (SAML / Okta)
            </button>
          </>
        )}

        {/* Security Note */}
        <div className="mt-6 pt-4 border-t border-[#333333] flex items-center justify-between text-xs text-[#BDBDBD]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#FFD54F]" />
            <span>EU GDPR Compliant</span>
          </div>
          <button
            type="button"
            onClick={() => setPrivacyModalOpen(true)}
            className="text-[11px] text-[#BDBDBD] hover:text-[#FFD54F] underline"
          >
            Privacy Notice
          </button>
        </div>

      </div>

      <PrivacyPolicyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </div>
  );
};
