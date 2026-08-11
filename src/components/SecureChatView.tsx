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
  ChevronUp,
  Cpu,
  Trash2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { ArtifactCanvas } from '@/components/ArtifactCanvas';
import { useAuth } from '@/context/AuthContext';

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
  searchSummary?: string;
  sources?: string[];
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
  const { session } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Model Selection State
  const [selectedModel, setSelectedModel] = useState<'anacleto-large' | 'anacleto-medium' | 'anacleto-small'>('anacleto-large');

  // Modern Capability Toggles
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [deepReasoningEnabled, setDeepReasoningEnabled] = useState(false);
  const [openThinkId, setOpenThinkId] = useState<string | null>(null);
  const [openSearchId, setOpenSearchId] = useState<string | null>(null);

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
          text: 'Welcome to Anacleto AI. Select between Anacleto-Large (Omni Reasoning), Anacleto-Medium (Balanced), and Anacleto-Small (Compact) from the model selector header.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'Anacleto-Large'
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
  const targetBufferRef = useRef<{ [msgId: string]: string }>({});
  const displayedTextRef = useRef<{ [msgId: string]: string }>({});
  const isStreamingRef = useRef<boolean>(false);
  const lastStepTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);

  const loadedSessionIds = useRef<Set<string>>(new Set());

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || {
    id: 'session-1',
    title: 'New Chat',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    messages: []
  };
  const messages = activeSession.messages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSessionId, messages, loading]);

  // Fetch Chat Sessions on Mount
  useEffect(() => {
    if (isConfigured && session?.user?.id) {
      const loadSessions = async () => {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (data && data.length > 0) {
          setSessions(prev => {
            const newSessions = data.map((d: any) => {
              const existing = prev.find(s => s.id === d.id);
              return {
                id: d.id,
                title: d.title,
                createdAt: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                messages: existing ? existing.messages : []
              };
            });
            return newSessions;
          });
          // Only change active session if we don't have one or it's a placeholder
          if (activeSessionId === 'session-1' && data[0].id) {
            setActiveSessionId(data[0].id);
          }
        }
      };
      loadSessions();
    }
  }, [isConfigured, session?.user?.id]);

  // Fetch Chat Messages when Active Session Changes
  useEffect(() => {
    if (isConfigured && session?.user && activeSessionId && !activeSessionId.startsWith('session-')) {
      if (!loadedSessionIds.current.has(activeSessionId)) {
        loadedSessionIds.current.add(activeSessionId);
        const loadMessages = async () => {
          const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', activeSessionId)
            .order('created_at', { ascending: true });
            
          if (data && data.length > 0) {
            setSessions(prev => prev.map(s => s.id === activeSessionId ? {
              ...s,
              messages: data.map((m: any) => ({
                id: m.id,
                sender: m.sender as 'user' | 'ai',
                text: m.text,
                modelUsed: m.model_used,
                searchSummary: m.search_summary,
                timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }))
            } : s));
          }
        };
        loadMessages();
      }
    }
  }, [activeSessionId, isConfigured, session]);

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
    latency: string,
    searchSummary?: string,
    sources?: string[]
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
                m.id === aiMsgId ? { ...m, text: currentText, modelUsed, latency, searchSummary, sources } : m
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

    let currentSessionId = activeSessionId;
    const userMsgText = inputMessage;
    const attachedName = selectedFile ? selectedFile.name : undefined;
    const attachedContent = extractedFileText;
    const activeModelKey = selectedModel;

    // Database: Create new session if local
    let sessionWasCreated = false;
    let newTitle = '';
    if (isConfigured && session?.user && currentSessionId.startsWith('session-')) {
      newTitle = userMsgText.slice(0, 30) + (userMsgText.length > 30 ? '...' : '');
      const { data, error } = await supabase.from('chat_sessions').insert({
        user_id: session.user.id,
        title: newTitle
      }).select('id').single();
      
      if (error) {
        console.error('Failed to create session in Supabase:', error);
      }
      
      if (data) {
        currentSessionId = data.id;
        setActiveSessionId(currentSessionId);
        loadedSessionIds.current.add(currentSessionId); // Prevent useEffect race condition
        sessionWasCreated = true;
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachedName ? [attachedName] : undefined
    };

    // Database: Insert User Message
    if (isConfigured && session?.user && !currentSessionId.startsWith('session-')) {
      const { error } = await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        sender: 'user',
        text: userMsgText
      });
      if (error) console.error('Failed to insert user message in Supabase:', error);
    }

    const aiMsgId = (Date.now() + 1).toString();
    const defaultModelName = activeModelKey === 'anacleto-small' ? 'Anacleto-Small' : activeModelKey === 'anacleto-medium' ? 'Anacleto-Medium' : 'Anacleto-Large';

    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: defaultModelName
    };

    setSessions((prevSessions) =>
      prevSessions.map((sess) => {
        // If we just created a new session, match against the old local activeSessionId
        // Otherwise, match against currentSessionId
        const isTargetSession = sessionWasCreated ? sess.id === activeSessionId : sess.id === currentSessionId;
        
        if (isTargetSession) {
          const finalTitle = sessionWasCreated ? newTitle : (sess.messages.length <= 1 && userMsgText 
            ? userMsgText.slice(0, 24) + (userMsgText.length > 24 ? '...' : '') 
            : sess.title);

          return {
            ...sess,
            id: currentSessionId, // Update the local session ID to the Supabase UUID!
            title: finalTitle,
            messages: [...sess.messages, userMessage, initialAiMsg]
          };
        }
        return sess;
      })
    );

    setInputMessage('');
    setSelectedFile(null);
    setExtractedFileText('');
    setLoading(true);

    targetBufferRef.current[aiMsgId] = '';
    displayedTextRef.current[aiMsgId] = '';
    isStreamingRef.current = true;
    lastStepTimeRef.current = performance.now();

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    // 60fps Adaptive Velocity & Deceleration Stream Engine
    const runAsymptoticStreamLoop = () => {
      const target = targetBufferRef.current[aiMsgId] || '';
      const current = displayedTextRef.current[aiMsgId] || '';

      if (current.length < target.length) {
        const remaining = target.length - current.length;

        // Continuous Velocity & Deceleration Curve:
        // Speed is a continuous function of the remaining characters.
        // This dynamically scales rendering speed to ensure it never falls too far behind.
        const step = Math.max(1, Math.floor(remaining / 10));
        
        // Delay is continuously adjusted: faster polling when far behind, slower when caught up.
        // Bounded between 8ms (120fps max update rate) and 35ms (~28fps typewriter crawl).
        const requiredDelay = Math.max(8, 35 - remaining);

        const now = performance.now();
        const elapsed = now - lastStepTimeRef.current;

        if (elapsed >= requiredDelay) {
          lastStepTimeRef.current = now;

          const nextText = target.slice(0, current.length + step);
          displayedTextRef.current[aiMsgId] = nextText;

          setSessions((prevSessions) =>
            prevSessions.map((sess) => {
              if (sess.id === currentSessionId) {
                return {
                  ...sess,
                  messages: sess.messages.map((m) =>
                    m.id === aiMsgId ? { ...m, text: nextText } : m
                  )
                };
              }
              return sess;
            })
          );
        }
      }

      if (isStreamingRef.current || (displayedTextRef.current[aiMsgId]?.length || 0) < (targetBufferRef.current[aiMsgId]?.length || 0)) {
        animationFrameIdRef.current = requestAnimationFrame(runAsymptoticStreamLoop);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(runAsymptoticStreamLoop);

    try {
      const historyContext = activeSession.messages.map((m) => ({
        sender: m.sender,
        text: m.text,
        id: m.id
      }));

      if (isConfigured) {
        const res = await fetch(SUPABASE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            message: userMsgText,
            attachment: attachedName || '',
            fileContent: attachedContent || '',
            webSearch: webSearchEnabled,
            deepReasoning: deepReasoningEnabled,
            model: activeModelKey,
            history: historyContext
          })
        });

        if (!res.ok || !res.body) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.response || errData.error || `Serverless endpoint error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          let eventIndex;
          while ((eventIndex = buffer.indexOf('\n\n')) !== -1) {
            const eventBlock = buffer.slice(0, eventIndex);
            buffer = buffer.slice(eventIndex + 2);

            const lines = eventBlock.split('\n');
            let eventType = 'message';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.substring(6).trim();
              } else if (line.startsWith('data:')) {
                dataStr = line.substring(5).trim();
              }
            }

            if (dataStr) {
              try {
                const eventData = JSON.parse(dataStr);

                if (eventType === 'text' && eventData.chunk) {
                  targetBufferRef.current[aiMsgId] = (targetBufferRef.current[aiMsgId] || '') + eventData.chunk;
                } else if (eventType === 'searchSummary') {
                  setSessions((prevSessions) =>
                    prevSessions.map((sess) => {
                      if (sess.id === currentSessionId) {
                        return {
                          ...sess,
                          messages: sess.messages.map((m) =>
                            m.id === aiMsgId ? {
                              ...m,
                              searchSummary: eventData.summary,
                              sources: eventData.sources
                            } : m
                          )
                        };
                      }
                      return sess;
                    })
                  );
                } else if (eventType === 'done') {
                  setSessions((prevSessions) =>
                    prevSessions.map((sess) => {
                      if (sess.id === currentSessionId) {
                        return {
                          ...sess,
                          messages: sess.messages.map((m) =>
                            m.id === aiMsgId ? {
                              ...m,
                              modelUsed: eventData.model || defaultModelName,
                              latency: eventData.latency || '25ms'
                            } : m
                          )
                        };
                      }
                      return sess;
                    })
                  );
                } else if (eventType === 'status') {
                  // Optional: Update some UI status if desired.
                } else if (eventType === 'error') {
                  throw new Error(eventData.message);
                }
              } catch (e) {
                // Ignore parsing errors for partial/malformed data chunks
                console.warn("SSE Parse Warning:", e, dataStr);
              }
            }
          }
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
          targetBufferRef.current[aiMsgId] = data.response;
        }
      }
    } catch (err: any) {
      console.error('Chat API Error:', err);
      targetBufferRef.current[aiMsgId] = `API Error: ${err.message || err}`;
      setSessions((prevSessions) =>
        prevSessions.map((sess) => {
          if (sess.id === currentSessionId) {
            return {
              ...sess,
              messages: sess.messages.map((m) =>
                m.id === aiMsgId ? { ...m, isError: true } : m
              )
            };
          }
          return sess;
        })
      );
    } finally {
      // Database: Insert AI Message
      if (isConfigured && session?.user && !currentSessionId.startsWith('session-') && targetBufferRef.current[aiMsgId]) {
        const finalModelUsed = activeModelKey === 'anacleto-small' ? 'Anacleto-Small' : activeModelKey === 'anacleto-medium' ? 'Anacleto-Medium' : 'Anacleto-Large';
        const { error } = await supabase.from('chat_messages').insert({
          session_id: currentSessionId,
          sender: 'ai',
          text: targetBufferRef.current[aiMsgId],
          model_used: finalModelUsed
        });
        if (error) console.error('Failed to insert AI message in Supabase:', error);
      }

      isStreamingRef.current = false;
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
          modelUsed: selectedModel === 'anacleto-small' ? 'Anacleto-Small' : selectedModel === 'anacleto-medium' ? 'Anacleto-Medium' : 'Anacleto-Large'
        }
      ]
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    
    // Optimistic UI update
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length === 0) {
        return [{
          id: 'session-1',
          title: 'New Chat',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          messages: []
        }];
      }
      return filtered;
    });

    if (activeSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : 'session-1');
    }
    
    // Delete from Database
    if (isConfigured && session?.user && !sessionId.startsWith('session-')) {
      const { error } = await supabase.from('chat_sessions').delete().eq('id', sessionId);
      if (error) console.error('Failed to delete session:', error);
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    const text = msg.text;
    const msgId = msg.id;
    let mainContent = text;
    let thinkBlock = '';
    let isThinkingInProgress = false;

    if (!text && !msg.searchSummary) {
      return (
        <div className="flex items-center gap-2 text-xs text-[#BDBDBD] py-1 font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-[#FFD54F]" />
          <span>{webSearchEnabled ? 'Searching web & reasoning...' : 'Generating response...'}</span>
        </div>
      );
    }

    // Advanced <think> Tag Stream Parser
    if (text.includes('<think>')) {
      const thinkStartIdx = text.indexOf('<think>');
      const thinkEndIdx = text.indexOf('</think>');

      if (thinkEndIdx !== -1) {
        // Completed <think>...</think> block
        thinkBlock = text.slice(thinkStartIdx + 7, thinkEndIdx).trim();
        mainContent = (text.slice(0, thinkStartIdx) + text.slice(thinkEndIdx + 8)).trim();
      } else {
        // Streaming <think>... block (in progress)
        isThinkingInProgress = true;
        thinkBlock = text.slice(thinkStartIdx + 7).trim();
        mainContent = text.slice(0, thinkStartIdx).trim();
      }
    }

    // Split main content by code block markers (both complete ```code``` and streaming ```code)
    const rawParts = mainContent.split(/(```[\s\S]*?(?:```|$))/g);

    return (
      <div className="space-y-3">
        {/* Accordion Web Search Tool Execution Box */}
        {msg.searchSummary ? (
          <div className="rounded-lg bg-[#121212] border border-[#FFD54F]/30 text-xs font-mono overflow-hidden my-2">
            <button
              onClick={() => setOpenSearchId(openSearchId === msgId ? null : msgId)}
              className="w-full px-3 py-2 bg-[#1A1A1A] hover:bg-[#252525] flex items-center justify-between text-[#FFD54F] transition-colors"
            >
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                <Globe className="w-3.5 h-3.5" />
                Web Search Output & Sources ({msg.sources?.length || 0})
              </span>
              {openSearchId === msgId ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {openSearchId === msgId && (
              <div className="p-3 text-[#BDBDBD] bg-[#0D0D0D] border-t border-[#252525] leading-relaxed whitespace-pre-wrap space-y-2">
                <div className="text-[11px] text-[#FFD54F] font-semibold">Injected Search Snippets:</div>
                <div className="text-[11px] font-mono leading-relaxed bg-[#121212] p-2.5 rounded border border-[#252525]">
                  {msg.searchSummary}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Accordion Reasoning Block (Handles both complete and streaming reasoning) */}
        {thinkBlock ? (() => {
          const isExplicitlyClosed = openThinkId === `closed-${msgId}`;
          const isThinkOpen = !isExplicitlyClosed;

          return (
            <div className="rounded-lg bg-[#121212] border border-[#333333] text-xs font-mono overflow-hidden my-2">
              <button
                onClick={() => setOpenThinkId(isExplicitlyClosed ? msgId : `closed-${msgId}`)}
                className="w-full px-3 py-2 bg-[#1A1A1A] hover:bg-[#252525] flex items-center justify-between text-[#FFD54F] transition-colors"
              >
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                  <Brain className="w-3.5 h-3.5 text-[#FFD54F]" />
                  Thinking Process & Reasoning Steps {isThinkingInProgress && '(Reasoning in Progress...)'}
                </span>
                {isThinkOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#FFD54F]" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isThinkOpen && (
                <div className="p-3 text-[#BDBDBD] bg-[#0D0D0D] border-t border-[#252525] leading-relaxed whitespace-pre-wrap">
                  {thinkBlock}
                  {isThinkingInProgress && (
                    <span className="inline-block w-2 h-4 ml-1 bg-[#FFD54F] animate-pulse align-middle" />
                  )}
                </div>
              )}
            </div>
          );
        })() : null}

        {/* Main Answer Message Text & Code Snippets */}
        {rawParts.map((part, idx) => {
          if (!part && isThinkingInProgress) return null;

          if (part.startsWith('```')) {
            let codeStr = part.slice(3);
            if (codeStr.endsWith('```')) {
              codeStr = codeStr.slice(0, -3);
            }
            const firstLineEnd = codeStr.indexOf('\n');
            const language = firstLineEnd !== -1 ? codeStr.slice(0, firstLineEnd).trim() : '';
            const codeContent = firstLineEnd !== -1 ? codeStr.slice(firstLineEnd + 1) : codeStr;

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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all group ${
                    isActive
                      ? 'bg-[#252525] text-[#FFD54F] border-l-2 border-[#FFD54F]'
                      : 'text-[#BDBDBD] hover:bg-[#252525]/50 hover:text-[#F5F5F5]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 text-[#FFD54F] flex-shrink-0" />
                    <span className="truncate">{sess.title}</span>
                  </div>
                  {!sess.id.startsWith('session-') && (
                    <button 
                      onClick={(e) => handleDeleteSession(e, sess.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-opacity"
                      title="Delete Chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
        
        {/* Top Header with Model Selection Dropdown */}
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
              <span className="font-semibold text-[#F5F5F5] truncate max-w-[140px] sm:max-w-xs">
                {activeSession.title}
              </span>
            </div>
          </div>

          {/* Model Selector Pill Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Cpu className="w-3.5 h-3.5 text-[#FFD54F] absolute left-2.5 pointer-events-none z-10" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as 'anacleto-large' | 'anacleto-medium' | 'anacleto-small')}
                className="bg-[#252525] text-[#FFD54F] border border-[#FFD54F]/40 pl-8 pr-7 py-1 rounded text-[11px] font-mono font-semibold focus:outline-none focus:border-[#FFD54F] cursor-pointer hover:bg-[#2F2F2F] transition-colors appearance-none"
              >
                <option value="anacleto-large">Anacleto-Large (Omni Reasoning)</option>
                <option value="anacleto-medium">Anacleto-Medium (Balanced)</option>
                <option value="anacleto-small">Anacleto-Small (Compact)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#FFD54F] absolute right-2 pointer-events-none" />
            </div>
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
                    {msg.sender === 'user' ? 'You' : msg.modelUsed || 'Anacleto AI'}
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

                <div>{renderMessageContent(msg)}</div>

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

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT CONTAINER */}
        <div className="p-4 sm:p-6 bg-[#121212] border-t border-[#333333] max-w-4xl w-full mx-auto">
          
          {/* Capability Toggle Action Bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 overflow-x-auto">
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

            <div className="text-[11px] font-mono text-[#BDBDBD]">
              Engine: <span className="text-[#FFD54F] font-semibold">{selectedModel === 'anacleto-small' ? 'Small' : selectedModel === 'anacleto-medium' ? 'Medium' : 'Large'}</span>
            </div>
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
                  ? `Ask ${selectedModel === 'anacleto-small' ? 'Anacleto-Small' : selectedModel === 'anacleto-medium' ? 'Anacleto-Medium' : 'Anacleto-Large'} with Live Web Search...` 
                  : deepReasoningEnabled 
                  ? `Ask ${selectedModel === 'anacleto-small' ? 'Anacleto-Small' : selectedModel === 'anacleto-medium' ? 'Anacleto-Medium' : 'Anacleto-Large'} complex reasoning...` 
                  : selectedFile 
                  ? `Ask about ${selectedFile.name}...` 
                  : `Ask ${selectedModel === 'anacleto-small' ? 'Anacleto-Small' : selectedModel === 'anacleto-medium' ? 'Anacleto-Medium' : 'Anacleto-Large'}...`
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
              Sovereign Enterprise Multi-Engine Suite.
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
