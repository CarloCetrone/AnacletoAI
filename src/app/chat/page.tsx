'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SecureChatView } from '@/components/SecureChatView';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1A1A1A] border border-[#333333] rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="inline-flex p-3 rounded-xl bg-[#FFD54F]/10 text-[#FFD54F] border border-[#FFD54F]/30 mb-2">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-[#F5F5F5]">
            Authentication Required
          </h2>
          <p className="text-xs text-[#BDBDBD]">
            Accessing sovereign chat models and endpoint consoles requires a verified user login session under GDPR compliance rules.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            Sign In to Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return <SecureChatView />;
}
