import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  Send, 
  ShieldCheck, 
  MessageSquare, 
  Plus, 
  Bot, 
  User, 
  ChevronRight,
  Sparkles,
  Code2,
  Lock,
  Loader2,
  Zap,
  AlertCircle
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

const SUPABASE_FUNCTION_URL = 'https://zzlptwfqqnjhxtvmebqb.supabase.co/functions/v1/chat';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8eu0QBwgFKoECWdlqf4DvQ_mtmVsixc';
const CHAT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYqzFN2cMmMkP3ikWEuizC_W5sgTpUueqja0E8kpzAQ4wv_7ZBZn5eMM9fMNyl4S0/exec';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  attachments?: string[];
  modelUsed?: string;
  latency?: string;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export const SecureChatView: React.FC = () => {
  const isConfigured = isSupabaseConfigured();

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-1',
      title: 'Legal Contract Analysis',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: 'welcome-msg',
          sender: 'ai',
          text: 'Welcome to Anacleto AI Console. Connected to RunPod Serverless frontier model (Anacleto-120B-Omni). How can I assist with your research, APIs, agents, or document analysis today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'Anacleto-120B-Omni (RunPod Streaming)'
        }
      ]
    },
    {
      id: 'session-2',
      title: 'Q3 Financial Report Summary',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: 'welcome-msg-2',
          sender: 'ai',
          text: 'Session connected for Q3 Financial Analysis. Send your prompt or upload financial spreadsheets.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'Anacleto-120B-Omni (RunPod Streaming)'
        }
      ]
    }
  ]);

  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSessionId, messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || loading) return;

    const currentSessionId = activeSessionId;
    const userMsgText = inputMessage;
    const attachedName = selectedFile ? selectedFile.name : undefined;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachedName ? [attachedName] : undefined
    };

    const aiMsgId = (Date.now() + 1).toString();
    const startTime = Date.now();

    // Create a single AI response message placeholder for real-time streaming
    const aiPlaceholderMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'Anacleto-120B-Omni (RunPod Streaming)',
      latency: 'Streaming...'
    };

    setSessions((prevSessions) =>
      prevSessions.map((sess) => {
        if (sess.id === currentSessionId) {
          const newTitle = sess.messages.length <= 1 && userMsgText 
            ? userMsgText.slice(0, 24) + (userMsgText.length > 24 ? '...' : '') 
            : sess.title;

          return {
            ...sess,
            title: newTitle,
            messages: [...sess.messages, userMessage, aiPlaceholderMsg]
          };
        }
        return sess;
      })
    );

    setInputMessage('');
    setSelectedFile(null);
    setLoading(true);

    try {
      const historyContext = activeSession.messages.map((m) => ({
        sender: m.sender,
        text: m.text,
        id: m.id
      }));

      // Stream directly from Supabase Edge Function
      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message: userMsgText,
          attachment: attachedName || '',
          history: historyContext
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          const lines = chunkText.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') {
                break;
              }

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.token) {
                  accumulatedText += parsed.token;
                  
                  // Update single active AI message in state in real-time
                  setSessions((prevSessions) =>
                    prevSessions.map((sess) => {
                      if (sess.id === currentSessionId) {
                        return {
                          ...sess,
                          messages: sess.messages.map((m) =>
                            m.id === aiMsgId ? { ...m, text: accumulatedText } : m
                          )
                        };
                      }
                      return sess;
                    })
                  );
                }
              } catch {
                // Ignore parsing artifacts
              }
            }
          }
        }

        const totalLatency = `${Date.now() - startTime}ms`;
        setSessions((prevSessions) =>
          prevSessions.map((sess) => {
            if (sess.id === currentSessionId) {
              return {
                ...sess,
                messages: sess.messages.map((m) =>
                  m.id === aiMsgId ? { ...m, latency: totalLatency } : m
                )
              };
            }
            return sess;
          })
        );
      } else {
        // Fallback to Google Apps Script
        const queryParams = new URLSearchParams({
          message: userMsgText,
          attachment: attachedName || '',
          history: JSON.stringify(historyContext)
        }).toString();

        const res = await fetch(`${CHAT_SCRIPT_URL}?${queryParams}`);
        const scriptData = await res.json();
        const totalLatency = `${Date.now() - startTime}ms`;

        setSessions((prevSessions) =>
          prevSessions.map((sess) => {
            if (sess.id === currentSessionId) {
              return {
                ...sess,
                messages: sess.messages.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        text: scriptData.response || 'No response received from model endpoint.',
                        latency: totalLatency,
                        isError: !scriptData.response
                      }
                    : m
                )
              };
            }
            return sess;
          })
        );
      }
    } catch (err) {
      console.error('Chat Streaming Error:', err);
      setSessions((prevSessions) =>
        prevSessions.map((sess) => {
          if (sess.id === currentSessionId) {
            return {
              ...sess,
              messages: sess.messages.map((m) =>
                m.id === aiMsgId
                  ? {
                      ...m,
                      text: `Streaming Error: Unable to complete RunPod stream. (${err})`,
                      isError: true
                    }
                  : m
              )
            };
          }
          return sess;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Session',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: `welcome-${newSessionId}`,
          sender: 'ai',
          text: 'Welcome to a new Anacleto AI Session. Connected to RunPod Serverless with real-time token streaming.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'Anacleto-120B-Omni (RunPod Streaming)'
        }
      ]
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
  };

  return (
    <div className="pt-16 h-[calc(100vh-64px)] flex overflow-hidden bg-[#121212] text-[#F5F5F5]">
      
      {/* LEFT SIDEBAR - SESSIONS LIST */}
      <aside className="w-64 sm:w-72 bg-[#1A1A1A] border-r border-[#333333] flex flex-col justify-between flex-shrink-0 hidden md:flex">
        <div className="p-4 space-y-4">
          
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 rounded-lg bg-transparent border border-[#FFD54F] hover:bg-[#FFD54F] hover:text-[#000000] text-[#FFD54F] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group shadow-md shadow-[#FFD54F]/10"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            New Session
          </button>

          {/* Sessions List */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold text-[#BDBDBD] uppercase tracking-wider">
              Active Sessions
            </div>
            {sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#252525] text-[#FFD54F] border-l-2 border-[#FFD54F]'
                      : 'text-[#BDBDBD] hover:bg-[#252525]/50 hover:text-[#F5F5F5]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="w-3.5 h-3.5 text-[#FFD54F] flex-shrink-0" />
                    <span className="truncate">{sess.title}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Security Footer */}
        <div className="p-4 border-t border-[#333333] bg-[#121212] text-xs text-[#BDBDBD] space-y-2">
          <div className="flex items-center gap-2 text-[#FFD54F] font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Sovereign Sandbox</span>
          </div>
          <p className="text-[11px] text-[#BDBDBD] leading-tight">
            Air-gapped deployment node: <span className="font-mono text-[#FFD54F]">eu-de-fra-01</span>
          </p>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col justify-between bg-[#121212] relative">
        
        {/* Top Chat Info Header */}
        <div className="h-12 border-b border-[#333333] bg-[#1A1A1A] px-6 flex items-center justify-between text-xs text-[#BDBDBD]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFD54F] animate-pulse"></span>
            <span className="font-semibold text-[#F5F5F5]">Active Session: {activeSession.title}</span>
            <span className="bg-[#252525] text-[#FFD54F] border border-[#FFD54F]/30 px-2 py-0.5 rounded text-[10px] font-mono">RunPod Streaming</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#BDBDBD]">
              <Code2 className="w-3 h-3 text-[#FFD54F]" /> Multi-Turn Memory
            </span>
            <span className="flex items-center gap-1 text-[#BDBDBD]">
              <Lock className="w-3 h-3 text-[#FFD54F]" /> 256-bit AES
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl w-full mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl p-0.5 flex-shrink-0 ${
                  msg.isError ? 'bg-red-500' : 'bg-[#FFD54F]'
                }`}>
                  <div className="w-full h-full bg-[#121212] rounded-[10px] flex items-center justify-center text-[#FFD54F]">
                    {msg.isError ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Bot className="w-5 h-5 text-[#FFD54F]" />}
                  </div>
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#FFD54F] text-[#000000] font-semibold rounded-tr-none shadow-lg shadow-[#FFD54F]/10'
                    : msg.isError
                    ? 'bg-red-950/40 border border-red-800 text-red-200 rounded-tl-none'
                    : 'bg-[#1A1A1A] border border-[#333333] text-[#F5F5F5] rounded-tl-none shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1.5 text-[11px] opacity-70 border-b border-current/10 pb-1">
                  <span className="font-semibold flex items-center gap-1">
                    {msg.sender === 'user' ? 'You (Enterprise Developer)' : 'Anacleto AI Model'}
                  </span>
                  <div className="flex items-center gap-2">
                    {msg.latency && (
                      <span className="flex items-center gap-1 text-emerald-400 font-mono">
                        <Zap className="w-3 h-3" />
                        {msg.latency}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                <div className="whitespace-pre-wrap">
                  {msg.text ? (
                    msg.text
                  ) : msg.sender === 'ai' && !msg.isError ? (
                    <div className="flex items-center gap-2 text-xs text-[#BDBDBD]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFD54F]" />
                      <span>Thinking...</span>
                    </div>
                  ) : null}
                </div>

                {msg.modelUsed && msg.sender === 'ai' && (
                  <div className="mt-3 pt-2 border-t border-[#333333] flex items-center justify-between text-[11px] font-mono text-[#FFD54F]/80">
                    <span>Engine: {msg.modelUsed}</span>
                  </div>
                )}

                {msg.attachments && (
                  <div className="mt-3 pt-2 border-t border-black/10 flex items-center gap-2 text-xs font-mono bg-black/10 p-2 rounded-lg text-black">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="truncate">{msg.attachments[0]}</span>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#252525] border border-[#333333] flex items-center justify-center text-[#F5F5F5] flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT CONTAINER */}
        <div className="p-4 sm:p-6 bg-[#121212] border-t border-[#333333] max-w-4xl w-full mx-auto">
          {selectedFile && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1A1A1A] border border-[#333333] text-xs text-[#FFD54F] font-mono">
              <Paperclip className="w-3.5 h-3.5" />
              <span className="max-w-xs truncate">{selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-[#666666] hover:text-white ml-1"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 p-2 rounded-lg text-[#BDBDBD] hover:text-[#FFD54F] hover:bg-[#1A1A1A] transition-colors"
              title="Attach File / Codebase"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={`Message ${activeSession.title}...`}
              className="w-full pl-12 pr-14 py-3.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all resize-none"
            />

            <button
              type="submit"
              disabled={(!inputMessage.trim() && !selectedFile) || loading}
              className="absolute right-3 p-2 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] disabled:opacity-30 disabled:hover:bg-[#FFD54F] text-[#000000] transition-all font-bold"
            >
              <Send className="w-4 h-4 font-bold" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-[#BDBDBD] mt-2 px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FFD54F]" />
              RunPod Token-by-Token SSE Stream Active.
            </span>
            <span className="hidden sm:inline">Press Shift + Enter for new line</span>
          </div>
        </div>

      </main>
    </div>
  );
};
