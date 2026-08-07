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
  Lock,
  Loader2,
  Zap,
  AlertCircle,
  Copy,
  Check,
  PanelLeftOpen,
  PanelLeftClose,
  FileText,
  Globe,
  Brain,
  Layout,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { ArtifactCanvas } from '@/components/ArtifactCanvas';

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

interface ArtifactData {
  title: string;
  type: 'code' | 'html' | 'svg' | 'markdown';
  content: string;
}

export const SecureChatView: React.FC = () => {
  const isConfigured = isSupabaseConfigured();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Modern Capability Toggles
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [deepReasoningEnabled, setDeepReasoningEnabled] = useState(false);
  const [openThinkId, setOpenThinkId] = useState<string | null>(null);

  // Side-by-Side Artifact Canvas State
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-1',
      title: 'New Conversation',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: 'welcome-msg',
          sender: 'ai',
          text: 'Welcome to Anacleto AI. Connected to Anacleto-120B-Omni. Toggle Web Search 🌐 or Deep Reasoning 🧠 below to enhance intelligence.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'Anacleto-120B-Omni'
        }
      ]
    }
  ]);

  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedFileText, setExtractedFileText] = useState<string>('');
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

  const copyToClipboard = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const extractPdfText = (rawPdfString: string): string => {
    const textMatches = rawPdfString.match(/\(([^()]+)\)\s*Tj/g) || rawPdfString.match(/T[dD]\s*\(([^()]+)\)/g);
    if (textMatches && textMatches.length > 0) {
      return textMatches
        .map((m) => m.replace(/^.*\(/, '').replace(/\)\s*T[jdD]$/, ''))
        .filter((t) => t.trim().length > 2)
        .join(' ');
    }
    const cleanPrintable = rawPdfString.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    return cleanPrintable.slice(0, 150000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        const rawContent = (event.target?.result as string) || '';
        
        if (file.name.endsWith('.pdf') || file.type.includes('pdf')) {
          const parsedPdfText = extractPdfText(rawContent);
          setExtractedFileText(parsedPdfText);
        } else {
          setExtractedFileText(rawContent.slice(0, 150000));
        }
      };

      reader.onerror = () => {
        setExtractedFileText('');
      };

      reader.readAsText(file);
    }
  };

  const animateStreamResponse = (
    aiMsgId: string, 
    fullText: string, 
    sessionId: string,
    modelUsed: string,
    latency: string
  ) => {
    let currentIdx = 0;
    const chunkSize = 3;
    const speed = 15;

    const interval = setInterval(() => {
      currentIdx += chunkSize;
      const currentText = fullText.slice(0, currentIdx);

      setSessions((prevSessions) =>
        prevSessions.map((sess) => {
          if (sess.id === sessionId) {
            return {
              ...sess,
              messages: sess.messages.map((m) =>
                m.id === aiMsgId ? { ...m, text: currentText, modelUsed, latency } : m
              )
            };
          }
          return sess;
        })
      );

      if (currentIdx >= fullText.length) {
        clearInterval(interval);
      }
    }, speed);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || loading) return;

    const currentSessionId = activeSessionId;
    const userMsgText = inputMessage;
    const attachedName = selectedFile ? selectedFile.name : undefined;
    const attachedContent = extractedFileText;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachedName ? [attachedName] : undefined
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
            messages: [...sess.messages, userMessage]
          };
        }
        return sess;
      })
    );

    setInputMessage('');
    setSelectedFile(null);
    setExtractedFileText('');
    setLoading(true);

    try {
      const historyContext = activeSession.messages.map((m) => ({
        sender: m.sender,
        text: m.text,
        id: m.id
      }));

      let aiReplyText = '';
      let isErr = false;
      let modelUsed = 'Anacleto-120B-Omni';
      let latency = '0ms';

      if (isConfigured) {
        const res = await fetch(SUPABASE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            message: userMsgText,
            attachment: attachedName || '',
            fileContent: attachedContent || '',
            webSearch: webSearchEnabled,
            deepReasoning: deepReasoningEnabled,
            history: historyContext
          })
        });

        const data = await res.json();
        if (res.ok && data.response) {
          aiReplyText = data.response;
          modelUsed = data.model || 'Anacleto-120B-Omni';
          latency = data.latency || '25ms';
        } else {
          aiReplyText = data.response || data.error || 'Serverless endpoint error.';
          isErr = true;
        }
      } else {
        const queryParams = new URLSearchParams({
          message: userMsgText,
          attachment: attachedName || '',
          fileContent: attachedContent || '',
          history: JSON.stringify(historyContext)
        }).toString();

        const response = await fetch(`${CHAT_SCRIPT_URL}?${queryParams}`);
        const data = await response.json();

        if (data && data.status === 'success' && data.response) {
          aiReplyText = data.response;
          latency = data.latency || '35ms';
        } else if (data && data.response) {
          aiReplyText = `API Error: ${data.response}`;
          isErr = true;
        } else {
          aiReplyText = 'No response received from endpoint.';
          isErr = true;
        }
      }

      const aiMsgId = (Date.now() + 1).toString();

      if (isErr) {
        const errorMsg: ChatMessage = {
          id: aiMsgId,
          sender: 'ai',
          text: aiReplyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed,
          latency,
          isError: true
        };
        setSessions((prevSessions) =>
          prevSessions.map((sess) => {
            if (sess.id === currentSessionId) {
              return { ...sess, messages: [...sess.messages, errorMsg] };
            }
            return sess;
          })
        );
      } else {
        const initialAiMsg: ChatMessage = {
          id: aiMsgId,
          sender: 'ai',
          text: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed,
          latency
        };

        setSessions((prevSessions) =>
          prevSessions.map((sess) => {
            if (sess.id === currentSessionId) {
              return { ...sess, messages: [...sess.messages, initialAiMsg] };
            }
            return sess;
          })
        );

        animateStreamResponse(aiMsgId, aiReplyText, currentSessionId, modelUsed, latency);
      }
    } catch (err: any) {
      console.error('Chat API Error:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Network Error: Unable to connect to backend endpoint. (${err.message || err})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'Anacleto-120B-Omni',
        latency: '0ms',
        isError: true
      };

      setSessions((prevSessions) =>
        prevSessions.map((sess) => {
          if (sess.id === currentSessionId) {
            return {
              ...sess,
              messages: [...sess.messages, errorMsg]
            };
          }
          return sess;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Conversation',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: `welcome-${newSessionId}`,
          sender: 'ai',
          text: 'Welcome to a new Anacleto AI Session. How can I assist you?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'Anacleto-120B-Omni'
        }
      ]
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setSidebarOpen(false);
  };

  const renderMessageContent = (text: string, msgId: string) => {
    let mainContent = text;
    let thinkBlock = '';

    // Extract <think> reasoning blocks for Deep Reasoning Mode
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      thinkBlock = thinkMatch[1].trim();
      mainContent = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    }

    const parts = mainContent.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3">
        {/* Accordion Reasoning Block */}
        {thinkBlock ? (
          <div className="rounded-lg bg-[#121212] border border-[#333333] text-xs font-mono overflow-hidden my-2">
            <button
              onClick={() => setOpenThinkId(openThinkId === msgId ? null : msgId)}
              className="w-full px-3 py-2 bg-[#1A1A1A] hover:bg-[#252525] flex items-center justify-between text-[#FFD54F] transition-colors"
            >
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                <Brain className="w-3.5 h-3.5" />
                Thinking Process & Reasoning Steps
              </span>
              {openThinkId === msgId ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {openThinkId === msgId && (
              <div className="p-3 text-[#BDBDBD] bg-[#0D0D0D] border-t border-[#252525] leading-relaxed whitespace-pre-wrap">
                {thinkBlock}
              </div>
            )}
          </div>
        ) : null}

        {/* Message Text & Code Snippets */}
        {parts.map((part, idx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const firstLineEnd = part.indexOf('\n');
            const language = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() : '';
            const codeContent = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3);

            const isHtmlSvg = language === 'html' || language === 'svg' || codeContent.includes('<svg');

            return (
              <div key={idx} className="my-3 rounded-lg overflow-hidden bg-[#0D0D0D] border border-[#2A2A2A] text-xs font-mono">
                <div className="bg-[#1A1A1A] px-4 py-2 flex items-center justify-between border-b border-[#2A2A2A] text-[#BDBDBD]">
                  <span className="uppercase font-semibold tracking-wider">{language || 'code'}</span>
                  <div className="flex items-center gap-3">
                    {isHtmlSvg && (
                      <button
                        onClick={() => {
                          setActiveArtifact({
                            title: `${language.toUpperCase()} Workspace`,
                            type: language === 'svg' ? 'svg' : 'html',
                            content: codeContent
                          });
                          setCanvasOpen(true);
                        }}
                        className="flex items-center gap-1 text-[#FFD54F] hover:underline font-sans text-[11px]"
                      >
                        <Layout className="w-3.5 h-3.5" />
                        Open Canvas
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(codeContent, `code-${idx}`)}
                      className="flex items-center gap-1 hover:text-[#FFD54F] transition-colors text-[11px]"
                    >
                      {copiedMsgId === `code-${idx}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <pre className="p-4 overflow-x-auto text-[#F5F5F5] leading-relaxed">
                  <code>{codeContent}</code>
                </pre>
              </div>
            );
          }

          return (
            <span key={idx} className="whitespace-pre-wrap">
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-[#121212] text-[#F5F5F5] relative">
      
      {/* MOBILE SIDEBAR BACKDROP */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`w-64 sm:w-72 bg-[#1A1A1A] border-r border-[#333333] flex flex-col justify-between flex-shrink-0 z-40 transition-transform duration-300 md:static fixed inset-y-0 left-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-4 space-y-4">
          
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 rounded-lg bg-transparent border border-[#FFD54F] hover:bg-[#FFD54F] hover:text-[#000000] text-[#FFD54F] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group shadow-md shadow-[#FFD54F]/10"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            New Session
          </button>

          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold text-[#BDBDBD] uppercase tracking-wider">
              Conversations
            </div>
            {sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    setActiveSessionId(sess.id);
                    setSidebarOpen(false);
                  }}
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

        <div className="p-4 border-t border-[#333333] bg-[#121212] text-xs text-[#BDBDBD] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#FFD54F] font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sovereign Sandbox</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col justify-between bg-[#121212] relative w-full overflow-hidden">
        
        {/* Streamlined Top Chat Info Header */}
        <div className="h-12 border-b border-[#333333] bg-[#1A1A1A] px-4 sm:px-6 flex items-center justify-between text-xs text-[#BDBDBD]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-md text-[#BDBDBD] hover:text-[#FFD54F] hover:bg-[#252525] md:hidden transition-colors"
              title="Toggle Conversations"
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFD54F] animate-pulse"></span>
              <span className="font-semibold text-[#F5F5F5] truncate max-w-[200px] sm:max-w-xs">
                {activeSession.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-[#252525] text-[#FFD54F] border border-[#FFD54F]/30 px-2.5 py-0.5 rounded text-[10px] font-mono">
              Anacleto-120B
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
                className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#FFD54F] text-[#000000] font-semibold rounded-tr-none shadow-lg shadow-[#FFD54F]/10'
                    : msg.isError
                    ? 'bg-red-950/40 border border-red-800 text-red-200 rounded-tl-none'
                    : 'bg-[#1A1A1A] border border-[#333333] text-[#F5F5F5] rounded-tl-none shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-2 text-[11px] opacity-70 border-b border-current/10 pb-1">
                  <span className="font-semibold flex items-center gap-1">
                    {msg.sender === 'user' ? 'You' : 'Anacleto AI'}
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

                <div>{renderMessageContent(msg.text, msg.id)}</div>

                {msg.sender === 'ai' && !msg.isError && (
                  <div className="mt-2 pt-2 border-t border-[#333333]/50 flex items-center justify-end">
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="text-xs text-[#BDBDBD] hover:text-[#FFD54F] transition-colors flex items-center gap-1"
                      title="Copy response"
                    >
                      {copiedMsgId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-[10px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {msg.attachments && (
                  <div className="mt-3 pt-2 border-t border-black/10 flex items-center gap-2 text-xs font-mono bg-black/10 p-2 rounded-lg text-black">
                    <FileText className="w-3.5 h-3.5" />
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

          {loading && (
            <div className="flex gap-3 sm:gap-4 justify-start">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFD54F] p-0.5 flex-shrink-0">
                <div className="w-full h-full bg-[#121212] rounded-[10px] flex items-center justify-center text-[#FFD54F]">
                  <Bot className="w-5 h-5 text-[#FFD54F]" />
                </div>
              </div>
              <div className="bg-[#1A1A1A] border border-[#333333] text-[#F5F5F5] rounded-2xl rounded-tl-none p-4 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#FFD54F]" />
                <span className="text-xs text-[#BDBDBD]">
                  {webSearchEnabled ? 'Searching real-time web & analyzing results...' : deepReasoningEnabled ? 'Performing deep multi-step reasoning...' : 'Anacleto AI is thinking...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT CONTAINER */}
        <div className="p-4 sm:p-6 bg-[#121212] border-t border-[#333333] max-w-4xl w-full mx-auto">
          
          {/* Capability Toggle Action Bar */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto">
            <button
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                webSearchEnabled 
                  ? 'bg-[#FFD54F] text-black border border-[#FFD54F] shadow-sm' 
                  : 'bg-[#1A1A1A] text-[#BDBDBD] border border-[#333333] hover:text-white hover:border-[#FFD54F]/50'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web Search</span>
            </button>

            <button
              onClick={() => setDeepReasoningEnabled(!deepReasoningEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                deepReasoningEnabled 
                  ? 'bg-[#FFD54F] text-black border border-[#FFD54F] shadow-sm' 
                  : 'bg-[#1A1A1A] text-[#BDBDBD] border border-[#333333] hover:text-white hover:border-[#FFD54F]/50'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Deep Reasoning</span>
            </button>
          </div>

          {selectedFile && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#FFD54F]/40 text-xs text-[#FFD54F] font-mono shadow-md">
              <FileText className="w-3.5 h-3.5 text-[#FFD54F]" />
              <span className="max-w-xs truncate font-semibold">{selectedFile.name}</span>
              {extractedFileText && (
                <span className="text-[10px] text-[#BDBDBD] bg-[#252525] px-1.5 py-0.5 rounded">
                  {extractedFileText.length.toLocaleString()} chars
                </span>
              )}
              <button
                onClick={() => { setSelectedFile(null); setExtractedFileText(''); }}
                className="text-[#666666] hover:text-white ml-1 font-bold"
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
              title="Attach File (PDF, TXT, CSV, Code, Images)"
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
              placeholder={
                webSearchEnabled 
                  ? "Ask anything with Live Web Search..." 
                  : deepReasoningEnabled 
                  ? "Ask complex reasoning or math problem..." 
                  : selectedFile 
                  ? `Ask about ${selectedFile.name}...` 
                  : "Ask Anacleto AI..."
              }
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
              Sovereign Enterprise Engine.
            </span>
            <span className="hidden sm:inline">Press Shift + Enter for new line</span>
          </div>
        </div>

      </main>

      {/* Side-by-Side Artifact Workspace Canvas */}
      {activeArtifact && (
        <ArtifactCanvas
          isOpen={canvasOpen}
          onClose={() => setCanvasOpen(false)}
          title={activeArtifact.title}
          type={activeArtifact.type}
          content={activeArtifact.content}
        />
      )}

    </div>
  );
};
