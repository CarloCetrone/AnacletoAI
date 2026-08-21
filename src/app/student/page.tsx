'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, KeyRound, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function StudentLandingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !accessKey.trim()) return;

    setError('');
    setIsLoading(true);

    try {
      // Verify if the lesson exists and is published
      const { data: lesson, error: dbError } = await supabase
        .from('lessons')
        .select('id, status')
        .eq('access_key', accessKey.trim().toUpperCase())
        .single();

      if (dbError || !lesson) {
        throw new Error('Invalid Access Key. Please check with your educator.');
      }
      
      if (lesson.status !== 'published') {
        throw new Error('This lesson is not yet published.');
      }

      // Proceed to the learn page
      router.push(`/student/learn?key=${encodeURIComponent(accessKey.trim().toUpperCase())}&name=${encodeURIComponent(nickname.trim())}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred connecting to the server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#0b0b0d] text-zinc-100 flex items-center justify-center font-sans selection:bg-zinc-700">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#FFD54F]/10 border border-[#FFD54F]/30 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-[#FFD54F]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F5F5] tracking-tight mb-2">Student Portal</h1>
          <p className="text-sm text-zinc-400">Join your interactive AI-guided learning session.</p>
        </div>

        <form onSubmit={handleJoin} className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Nickname</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full bg-[#121214] border border-zinc-700 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#FFD54F] text-white transition-colors"
                placeholder="How should the AI address you?"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Access Key</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                required
                className="w-full bg-[#121214] border border-zinc-700 rounded-xl pl-12 pr-4 py-3.5 text-sm font-mono tracking-widest focus:outline-none focus:border-[#FFD54F] text-white uppercase transition-colors"
                placeholder="e.g. ABCD1234"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !nickname.trim() || !accessKey.trim()}
            className="w-full py-4 rounded-xl bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-extrabold text-sm uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Connecting...' : 'Join Session'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
