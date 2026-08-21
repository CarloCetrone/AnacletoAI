'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Loader2, BookOpen, ShieldCheck, Bot, User, GraduationCap, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

function StudentTutorChat() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const accessKey = searchParams.get('key');
  const studentName = searchParams.get('name');
  
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('Loading Lesson...');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const TUTOR_CHAT_URL = 'https://zzlptwfqqnjhxtvmebqb.supabase.co/functions/v1/tutor-chat';

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!accessKey || !studentName) {
      router.push('/student');
      return;
    }
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeSession();
    }
  }, [accessKey, studentName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const initializeSession = async () => {
    try {
      // 1. Get lesson ID
      const { data: lesson, error: dbError } = await supabase
        .from('lessons')
        .select('id, title, status')
        .eq('access_key', accessKey)
        .single();
        
      if (dbError || !lesson) throw new Error('Invalid Access Key.');
      if (lesson.status !== 'published') throw new Error('Lesson is not available.');
      
      setLessonId(lesson.id);
      setLessonTitle(lesson.title);
      
      // 2. Create student session
      const { data: session, error: sessError } = await supabase
        .from('student_sessions')
        .insert({
          lesson_id: lesson.id,
          student_username: studentName,
          chat_history: []
        })
        .select('id')
        .single();
        
      if (sessError || !session) throw new Error('Failed to start session.');
      setSessionId(session.id);
      
      // 3. Initiate first message from Tutor
      handleSendChat("Hello! I am ready to start the lesson.", lesson.id, session.id);
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSendChat = async (overrideMsg?: string, forceLessonId?: string, forceSessionId?: string) => {
    const msgToSend = overrideMsg || inputMsg;
    if (!msgToSend.trim() && !overrideMsg) return;
    
    const activeLessonId = forceLessonId || lessonId;
    const activeSessionId = forceSessionId || sessionId;
    
    if (!overrideMsg) {
      setInputMsg('');
      setMessages((prev) => [...prev, { sender: 'student', text: msgToSend }]);
    }
    
    setIsLoading(true);

    try {
      const res = await fetch(TUTOR_CHAT_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: msgToSend,
          sessionId: activeSessionId,
          lessonId: activeLessonId,
          studentUsername: studentName
        })
      });

      if (!res.ok) throw new Error('Failed to communicate with the tutor.');
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let aiText = '';

      setMessages((prev) => [...prev, { sender: 'tutor', text: '', id: 'temp' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          
          let eventIndex;
          while ((eventIndex = buffer.indexOf('\n\n')) !== -1) {
            const eventBlock = buffer.slice(0, eventIndex);
            buffer = buffer.slice(eventIndex + 2);
            let eventType = 'message';
            let dataStr = '';
            for (const line of eventBlock.split('\n')) {
              if (line.startsWith('event:')) eventType = line.substring(6).trim();
              else if (line.startsWith('data:')) dataStr = line.substring(5).trim();
            }
            if (dataStr) {
              const data = JSON.parse(dataStr);
              if (eventType === 'text') {
                aiText += data.chunk;
                setMessages((prev) => prev.map(m => m.id === 'temp' ? { ...m, text: aiText } : m));
              }
            }
          }
        }
      }
      setMessages((prev) => prev.map(m => m.id === 'temp' ? { ...m, id: Date.now().toString() } : m));
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [...prev.filter(m => m.id !== 'temp'), { sender: 'tutor', text: 'Error connecting to the tutor service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen pt-24 bg-[#0b0b0d] flex items-center justify-center text-zinc-100">
        <div className="text-center p-8 bg-[#1A1A1A] border border-red-500/30 rounded-2xl max-w-md w-full mx-4">
           <h2 className="text-xl font-bold text-[#FFD54F] mb-4">Connection Failed</h2>
           <p className="text-sm text-zinc-400 mb-6">{error}</p>
           <Link href="/student" className="inline-block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">Go Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-[#121212] relative overflow-hidden rounded-tl-2xl border-t border-l border-[#333333]">
        
        {/* Top Header */}
        <div className="h-14 border-b border-[#333333] flex items-center justify-between px-4 sm:px-6 bg-[#1A1A1A]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFD54F]/10 border border-[#FFD54F]/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#FFD54F]" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm flex items-center gap-2">AI Tutor - {lessonTitle}</h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#FFD54F]" /> Guided Sovereign Session
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-xs font-bold text-white">{studentName}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Student</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#FFD54F]/20 text-[#FFD54F] font-black flex items-center justify-center text-sm border border-[#FFD54F]/30">
              {studentName?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 scroll-smooth">
           <div className="max-w-4xl mx-auto space-y-8 pb-32">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 w-full ${msg.sender === 'student' ? 'flex-row-reverse' : ''}`}>
                  
                  {msg.sender === 'tutor' ? (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD54F]/20 to-[#FFD54F]/5 border border-[#FFD54F]/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#FFD54F]/5">
                      <Bot className="w-6 h-6 text-[#FFD54F]" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-zinc-400" />
                    </div>
                  )}

                  <div className={`flex flex-col gap-2 max-w-[85%] sm:max-w-[75%] ${msg.sender === 'student' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl p-4 sm:p-5 text-[15px] leading-relaxed shadow-sm ${msg.sender === 'student' ? 'bg-[#FFD54F] text-black font-medium' : 'bg-[#1A1A1A] border border-[#333333] text-zinc-200'}`}>
                      {msg.sender === 'tutor' ? (
                         <div className="prose prose-invert max-w-none text-[15px] prose-p:leading-relaxed">
                           <ReactMarkdown 
                              remarkPlugins={[remarkGfm, remarkMath]} 
                              rehypePlugins={[rehypeKatex]}
                           >
                             {msg.text}
                           </ReactMarkdown>
                         </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 w-full">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD54F]/20 to-[#FFD54F]/5 border border-[#FFD54F]/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#FFD54F]/5">
                      <Loader2 className="w-5 h-5 text-[#FFD54F] animate-spin" />
                   </div>
                   <div className="flex flex-col justify-center">
                     <span className="text-xs text-[#FFD54F]/70 font-mono uppercase tracking-widest">Tutor is thinking...</span>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
           </div>
        </main>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent pointer-events-none z-20">
           <div className="max-w-3xl mx-auto pointer-events-auto">
             <div className="relative group bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-colors rounded-2xl shadow-2xl focus-within:border-[#FFD54F]/50 focus-within:ring-1 focus-within:ring-[#FFD54F]/20">
                <div className="flex flex-col">
                  <textarea
                    rows={1}
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    onKeyDown={e => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleSendChat();
                       }
                    }}
                    placeholder={isLoading ? "Tutor is writing..." : "Type your response to the tutor..."}
                    disabled={isLoading}
                    className="w-full bg-transparent text-white px-4 py-4 text-[15px] focus:outline-none resize-none placeholder-zinc-500 min-h-[60px] disabled:opacity-50"
                  />
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[#333333]/50">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-800">
                         Anacleto Practician Engine
                       </span>
                    </div>
                    <button 
                      disabled={isLoading || !inputMsg.trim()} 
                      onClick={() => handleSendChat()} 
                      className={`p-2 rounded-xl transition-all flex items-center justify-center ${isLoading || !inputMsg.trim() ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-[#FFD54F] hover:bg-[#FFCA28] text-black shadow-lg shadow-[#FFD54F]/20'}`}
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentTutorChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0b0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFD54F] animate-spin" />
      </div>
    }>
      <StudentTutorChat />
    </Suspense>
  );
}
