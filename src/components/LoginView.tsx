import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, Atom } from 'lucide-react';

interface LoginViewProps {
  onNavigate: (view: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('chat');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-20 relative">
      {/* Background Gold Ambient Glow */}
      <div className="absolute w-96 h-96 bg-[#FFD54F]/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#1A1A1A] border border-[#333333] rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 text-[#FFD54F] mb-4">
            <Atom className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-tight uppercase">
            Access Anacleto AI Workspace
          </h2>
          <p className="text-[#BDBDBD] text-xs sm:text-sm mt-1">
            API Endpoints, Chat Console & Sovereign Models
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-2">
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider">
                Password
              </label>
              <a href="#" className="text-xs text-[#FFD54F] hover:underline transition-colors">
                Forgot?
              </a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] text-[#000000] font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-md shadow-[#FFD54F]/20 flex items-center justify-center gap-2 group"
          >
            Sign In
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333333]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#1A1A1A] px-3 text-[#666666] font-semibold tracking-wider">
              OR
            </span>
          </div>
        </div>

        {/* SSO Button */}
        <button
          type="button"
          onClick={() => onNavigate('chat')}
          className="w-full py-3 px-4 rounded-lg border border-[#333333] bg-[#121212] hover:bg-[#252525] text-[#F5F5F5] font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2.5"
        >
          <KeyRound className="w-4 h-4 text-[#FFD54F]" />
          Sign in with SSO (SAML/Okta)
        </button>

        {/* Security Note */}
        <div className="mt-6 pt-4 border-t border-[#333333] flex items-center justify-center gap-2 text-xs text-[#BDBDBD]">
          <ShieldCheck className="w-4 h-4 text-[#FFD54F]" />
          <span>End-to-end encrypted connection.</span>
        </div>

      </div>
    </div>
  );
};
