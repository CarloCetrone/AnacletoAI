import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Paperclip, Send, ShieldCheck, MessageSquare, Plus, Bot, User, 
  ChevronRight, Sparkles, Lock, Loader2, Zap, AlertCircle, Copy, Check, 
  PanelLeftOpen, PanelLeftClose, FileText, Globe, Brain, Layout, 
  ChevronDown, ChevronUp, Cpu, Trash2, Image as ImageIcon, Box, BookOpen, Download
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { ArtifactCanvas } from '@/components/ArtifactCanvas';
import { useAuth } from '@/context/AuthContext';

// Dynamic import for model-viewer to avoid SSR issues
const ModelViewer = dynamic(() => import('@google/model-viewer').then(() => {
  return function ModelViewerComponent(props: any) {
    return React.createElement('model-viewer', props);
  }
}), { ssr: false });

const SUPABASE_FUNCTION_URL = 'https://zzlptwfqqnjhxtvmebqb.supabase.co/functions/v1/chat';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8eu0QBwgFKoECWdlqf4DvQ_mtmVsixc';

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
  activeTool?: string;
  images?: string[];
  models3D?: any[];
  latexBlocks?: { code: string, isSlideshow: boolean }[];
  executedTools?: { name: string, args: any, status: 'loading' | 'done' | 'error' }[];
  thoughts?: string;
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

  const [selectedModel, setSelectedModel] = useState<'anacleto-large' | 'anacleto-medium' | 'anacleto-small'>('anacleto-large');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [deepReasoningEnabled, setDeepReasoningEnabled] = useState(false);
  const [imageGenEnabled, setImageGenEnabled] = useState(false);
  const [model3DEnabled, setModel3DEnabled] = useState(false);
  const [pdfGenEnabled, setPdfGenEnabled] = useState(false);
  const [slideshowGenEnabled, setSlideshowGenEnabled] = useState(false);
  const [openThinkId, setOpenThinkId] = useState<string | null>(null);
  const [openSearchId, setOpenSearchId] = useState<string | null>(null);

  const [canvasOpen, setCanvasOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-1',
      title: 'New Conversation',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [{
        id: 'welcome-msg',
        sender: 'ai',
        text: 'Welcome to Anacleto AI. Select your Anacleto model from the header and toggle the multimodal tools you need below.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'Anacleto-Large'
      }]
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
    id: 'session-1', title: 'New Chat', createdAt: new Date().toLocaleTimeString(), messages: []
  };
  const messages = activeSession.messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSessionId, messages, loading]);

  const copyToClipboard = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setExtractedFileText('Extracting text...');
      
      try {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          // Dynamically import pdfjs-dist to avoid SSR Iterator errors in Node 20
          const pdfjsLib = await import('pdfjs-dist');
          if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
          }
          
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) { // Limit to 10 pages for speed/tokens
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
          }
          setExtractedFileText(fullText.slice(0, 150000));
        } else {
          const reader = new FileReader();
          reader.onload = (event) => setExtractedFileText((event.target?.result as string).slice(0, 150000));
          reader.readAsText(file);
        }
      } catch (err) {
        console.error("File extraction error:", err);
        setExtractedFileText("Failed to extract file text.");
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || loading) return;

    let currentSessionId = activeSessionId;
    const userMsgText = inputMessage;
    const attachedName = selectedFile ? selectedFile.name : undefined;
    const attachedContent = extractedFileText;
    const activeModelKey = selectedModel;

    let sessionWasCreated = false;
    let newTitle = '';
    if (isConfigured && session?.user && currentSessionId.startsWith('session-')) {
      newTitle = userMsgText.slice(0, 30) + (userMsgText.length > 30 ? '...' : '');
      const { data } = await supabase.from('chat_sessions').insert({ user_id: session.user.id, title: newTitle }).select('id').single();
      if (data) {
        currentSessionId = data.id;
        setActiveSessionId(currentSessionId);
        loadedSessionIds.current.add(currentSessionId);
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

    if (isConfigured && session?.user && !currentSessionId.startsWith('session-')) {
      supabase.from('chat_messages').insert({ session_id: currentSessionId, sender: 'user', text: userMsgText }).then();
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

    setSessions((prev) => prev.map((sess) => {
      if ((sessionWasCreated && sess.id === activeSessionId) || (!sessionWasCreated && sess.id === currentSessionId)) {
        return {
          ...sess,
          id: currentSessionId,
          title: sessionWasCreated ? newTitle : sess.title,
          messages: [...sess.messages, userMessage, initialAiMsg]
        };
      }
      return sess;
    }));

    setInputMessage('');
    setSelectedFile(null);
    setExtractedFileText('');
    setLoading(true);

    targetBufferRef.current[aiMsgId] = '';
    displayedTextRef.current[aiMsgId] = '';
    isStreamingRef.current = true;
    lastStepTimeRef.current = performance.now();

    const runAsymptoticStreamLoop = () => {
      const target = targetBufferRef.current[aiMsgId] || '';
      const current = displayedTextRef.current[aiMsgId] || '';
      if (current.length < target.length) {
        const remaining = target.length - current.length;
        const step = Math.max(1, Math.floor(remaining / 10));
        const requiredDelay = Math.max(8, 35 - remaining);
        const now = performance.now();
        if (now - lastStepTimeRef.current >= requiredDelay) {
          lastStepTimeRef.current = now;
          const nextText = target.slice(0, current.length + step);
          displayedTextRef.current[aiMsgId] = nextText;
          setSessions((prev) => prev.map((sess) => sess.id === currentSessionId ? {
            ...sess, messages: sess.messages.map((m) => m.id === aiMsgId ? { ...m, text: nextText } : m)
          } : sess));
        }
      }
      if (isStreamingRef.current || (displayedTextRef.current[aiMsgId]?.length || 0) < (targetBufferRef.current[aiMsgId]?.length || 0)) {
        animationFrameIdRef.current = requestAnimationFrame(runAsymptoticStreamLoop);
      }
    };
    animationFrameIdRef.current = requestAnimationFrame(runAsymptoticStreamLoop);

    try {
      const historyContext = activeSession.messages.map((m) => ({ sender: m.sender, text: m.text, id: m.id }));
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ message: userMsgText, attachment: attachedName || '', fileContent: attachedContent || '', webSearch: webSearchEnabled, deepReasoning: deepReasoningEnabled, imageGen: imageGenEnabled, model3D: model3DEnabled, pdfGen: pdfGenEnabled, slideshowGen: slideshowGenEnabled, model: activeModelKey, history: historyContext })
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

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
              try {
                const eventData = JSON.parse(dataStr);
                if (eventType === 'text' && eventData.chunk) {
                  targetBufferRef.current[aiMsgId] = (targetBufferRef.current[aiMsgId] || '') + eventData.chunk;
                } else if (eventType === 'tool_start') {
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s, messages: s.messages.map(m => m.id === aiMsgId ? { 
                       ...m, 
                       activeTool: eventData.name,
                       executedTools: [...(m.executedTools || []), { name: eventData.name, args: eventData.args, status: 'loading' }]
                    } : m)
                  } : s));
                } else if (eventType === 'tool_end') {
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s, messages: s.messages.map(m => m.id === aiMsgId ? { 
                       ...m, 
                       activeTool: undefined,
                       executedTools: (m.executedTools || []).map((t, idx, arr) => idx === arr.length - 1 ? { ...t, status: 'done' } : t)
                    } : m)
                  } : s));
                } else if (eventType === 'image_generated') {
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, images: [...(m.images || []), eventData.base64] } : m)
                  } : s));
                } else if (eventType === 'model_3d_generated') {
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, models3D: [...(m.models3D || []), eventData.result] } : m)
                  } : s));
                } else if (eventType === 'latex_generated') {
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, latexBlocks: [...(m.latexBlocks || []), { code: eventData.code, isSlideshow: eventData.isSlideshow }] } : m)
                  } : s));
                } else if (eventType === 'searchSummary') {
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, searchSummary: eventData.summary, sources: eventData.sources } : m)
                  } : s));
                } else if (eventType === 'error') {
                  throw new Error(eventData.message);
                }
              } catch (e) {
                console.warn("SSE Parse Warning:", e, dataStr);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Chat API Error:', err);
      targetBufferRef.current[aiMsgId] = `API Error: ${err.message || err}`;
      setSessions((prev) => prev.map((sess) => sess.id === currentSessionId ? {
        ...sess, messages: sess.messages.map((m) => m.id === aiMsgId ? { ...m, isError: true } : m)
      } : sess));
    } finally {
      isStreamingRef.current = false;
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId, title: 'New Conversation', createdAt: new Date().toLocaleTimeString(),
      messages: [{ id: `welcome-${newSessionId}`, sender: 'ai', text: 'How can I assist you today?', timestamp: new Date().toLocaleTimeString(), modelUsed: 'Llama 3.1 70B' }]
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      return filtered.length === 0 ? [{ id: 'session-1', title: 'New Chat', createdAt: new Date().toLocaleTimeString(), messages: [] }] : filtered;
    });
    if (activeSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : 'session-1');
    }
    if (isConfigured && session?.user && !sessionId.startsWith('session-')) {
      supabase.from('chat_sessions').delete().eq('id', sessionId).then();
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    const msgId = msg.id;
    let cleanText = msg.text || '';
    let thoughtsText = msg.thoughts || '';
    
    // Extract thought tags
    const thoughtMatch = cleanText.match(/<thought>([\s\S]*?)<\/thought>/i) || cleanText.match(/<thought>([\s\S]*?)$/i);
    if (thoughtMatch) {
       thoughtsText = thoughtMatch[1];
       cleanText = cleanText.replace(/<thought>[\s\S]*?(<\/thought>|$)/i, '').trim();
    }

    if (!cleanText && !thoughtsText && !msg.searchSummary && !msg.activeTool && (!msg.executedTools || msg.executedTools.length === 0) && !msg.images && !msg.models3D && !msg.latexBlocks) {
      return (
        <div className="flex items-center gap-2 text-xs text-[#BDBDBD] py-1 font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-[#FFD54F]" />
          <span>Generating response...</span>
        </div>
      );
    }

    const rawParts = cleanText.split(/(```[\s\S]*?(?:```|$))/g);

    return (
      <div className="space-y-3">
        {msg.activeTool && (
          <div className="flex items-center gap-2 text-xs text-[#FFD54F] py-1.5 px-3 rounded bg-[#FFD54F]/10 font-mono border border-[#FFD54F]/20 mb-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="uppercase font-semibold tracking-wider">Executing {msg.activeTool.replace('_', ' ')}...</span>
          </div>
        )}

        {msg.executedTools && msg.executedTools.length > 0 && (
          <div className="rounded-lg bg-[#121212] border border-[#FFD54F]/30 text-xs font-mono overflow-hidden my-2">
            <button
              onClick={() => setOpenSearchId(openSearchId === msgId ? null : msgId)}
              className="w-full px-3 py-2 bg-[#1A1A1A] hover:bg-[#252525] flex items-center justify-between text-[#BDBDBD] transition-colors"
            >
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-[#FFD54F]">
                <Cpu className="w-3.5 h-3.5" /> Executed Tools ({msg.executedTools.length})
              </span>
              {openSearchId === msgId ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {openSearchId === msgId && (
              <div className="p-3 text-[#BDBDBD] bg-[#0D0D0D] border-t border-[#252525] leading-relaxed flex flex-col gap-2">
                {msg.executedTools.map((t, idx) => (
                   <div key={idx} className="flex flex-col gap-1 border-b border-[#333333]/50 pb-2 mb-1 last:border-0 last:mb-0 last:pb-0">
                      <span className="text-[#FFD54F] font-bold capitalize">{t.name.replace('_', ' ')}</span>
                      <span className="opacity-70 text-[10px] break-all">{JSON.stringify(t.args)}</span>
                      {t.status === 'loading' && <span className="flex items-center gap-1 text-blue-400 text-[10px] mt-1"><Loader2 className="w-3 h-3 animate-spin"/> Running...</span>}
                      {t.status === 'done' && <span className="flex items-center gap-1 text-emerald-400 text-[10px] mt-1"><Check className="w-3 h-3"/> Completed</span>}
                   </div>
                ))}
              </div>
            )}
          </div>
        )}

        {thoughtsText && (
          <div className="rounded-lg bg-[#121212] border border-blue-500/30 text-xs font-mono overflow-hidden my-2">
            <button
              onClick={() => setOpenThinkId(openThinkId === msgId ? null : msgId)}
              className="w-full px-3 py-2 bg-[#1A1A1A] hover:bg-[#252525] flex items-center justify-between text-[#BDBDBD] transition-colors"
            >
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-blue-400">
                <Brain className="w-3.5 h-3.5" /> Reasoning
              </span>
              {openThinkId === msgId ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {openThinkId === msgId && (
              <div className="p-3 text-blue-100 bg-[#0D0D0D] border-t border-[#252525] leading-relaxed whitespace-pre-wrap">
                {thoughtsText}
              </div>
            )}
          </div>
        )}

        {msg.searchSummary && (
          <div className="rounded-lg bg-[#121212] border border-[#FFD54F]/30 text-xs font-mono overflow-hidden my-2">
            <button
              onClick={() => setOpenSearchId(openSearchId === msgId ? null : msgId)}
              className="w-full px-3 py-2 bg-[#1A1A1A] hover:bg-[#252525] flex items-center justify-between text-[#FFD54F] transition-colors"
            >
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                <Globe className="w-3.5 h-3.5" /> Web Search Sources ({msg.sources?.length || 0})
              </span>
              {openSearchId === msgId ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {openSearchId === msgId && (
              <div className="p-3 text-[#BDBDBD] bg-[#0D0D0D] border-t border-[#252525] leading-relaxed whitespace-pre-wrap">
                {msg.searchSummary}
              </div>
            )}
          </div>
        )}

        {msg.images && msg.images.length > 0 && (
           <div className="flex flex-wrap gap-2 my-3">
              {msg.images.map((imgBase64, idx) => (
                 <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#333333] shadow-lg">
                   <img src={`data:image/jpeg;base64,${imgBase64}`} alt="Generated Content" className="w-64 h-64 object-cover" />
                 </div>
              ))}
           </div>
        )}

        {msg.models3D && msg.models3D.length > 0 && (
           <div className="flex flex-col gap-3 my-3">
              {msg.models3D.map((res, idx) => {
                 let glbUrl = typeof res === 'string' && res.startsWith('http') ? res : (res?.model_url || '');
                 if (typeof res === 'string' && res.length > 1000 && !res.startsWith('http')) {
                    glbUrl = `data:model/gltf-binary;base64,${res}`;
                 }
                 return glbUrl ? (
                   <div key={idx} className="h-64 w-full max-w-sm rounded-xl overflow-hidden border border-[#333333] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]">
                     <ModelViewer src={glbUrl} auto-rotate camera-controls style={{ width: '100%', height: '100%' }} />
                   </div>
                 ) : (
                   <div key={idx} className="p-3 bg-black/50 text-xs border border-white/10 rounded-lg text-emerald-400 font-mono">
                     <span className="text-white block mb-1">3D Data Generated (Raw):</span>
                     {JSON.stringify(res).slice(0, 150)}...
                   </div>
                 );
              })}
           </div>
        )}

        {msg.latexBlocks && msg.latexBlocks.length > 0 && (
           <div className="flex flex-col gap-3 my-3">
              {msg.latexBlocks.map((block, idx) => {
                 const pdfUrl = `https://latexonline.cc/compile?text=${encodeURIComponent(block.code)}`;
                 return (
                 <div key={idx} className="border border-[#333333] rounded-lg overflow-hidden bg-[#1A1A1A] text-white shadow-md">
                   <div className="bg-[#252525] p-3 flex justify-between items-center border-b border-[#333333]">
                     <span className="flex items-center gap-2 font-bold text-sm">
                       <BookOpen className="w-4 h-4 text-[#FFD54F]" /> 
                       {block.isSlideshow ? 'Beamer Presentation' : 'LaTeX Document Rendering'}
                     </span>
                     <button onClick={() => window.open(pdfUrl, '_blank')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD54F] text-black text-xs font-bold rounded hover:bg-[#ffc107] transition-colors">
                       <Maximize2 className="w-3.5 h-3.5"/> Open Full Screen
                     </button>
                   </div>
                   <div className="w-full h-[600px] bg-white">
                     <iframe src={pdfUrl} className="w-full h-full border-0" title="PDF Viewer" />
                   </div>
                 </div>
                 );
              })}
           </div>
        )}

        {rawParts.map((part, idx) => {
          if (!part) return null;
          if (part.startsWith('```')) {
            let codeStr = part.slice(3).replace(/```$/, '');
            const firstLineEnd = codeStr.indexOf('\n');
            const language = firstLineEnd !== -1 ? codeStr.slice(0, firstLineEnd).trim() : '';
            const codeContent = firstLineEnd !== -1 ? codeStr.slice(firstLineEnd + 1) : codeStr;

            return (
              <div key={idx} className="my-3 rounded-lg overflow-hidden bg-[#0D0D0D] border border-[#2A2A2A] text-xs font-mono">
                <div className="bg-[#1A1A1A] px-4 py-2 flex items-center justify-between border-b border-[#2A2A2A] text-[#BDBDBD]">
                  <span className="uppercase font-semibold tracking-wider">{language || 'code'}</span>
                  <button onClick={() => copyToClipboard(codeContent, `code-${idx}`)} className="flex items-center gap-1 hover:text-[#FFD54F] transition-colors text-[11px]">
                    <Copy className="w-3.5 h-3.5" /> Copy Code
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[#F5F5F5] leading-relaxed"><code>{codeContent}</code></pre>
              </div>
            );
          }
          return <span key={idx} className="whitespace-pre-wrap leading-relaxed">{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-[#121212] text-[#F5F5F5] relative">
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" />}

      <aside className={`w-64 sm:w-72 bg-[#1A1A1A] border-r border-[#333333] flex flex-col justify-between flex-shrink-0 z-40 transition-transform duration-300 md:static fixed inset-y-0 left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 space-y-4">
          <button onClick={handleNewChat} className="w-full py-2.5 px-4 rounded-lg bg-transparent border border-[#FFD54F] hover:bg-[#FFD54F] hover:text-[#000000] text-[#FFD54F] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group shadow-md shadow-[#FFD54F]/10">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> New Session
          </button>
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold text-[#BDBDBD] uppercase tracking-wider">Conversations</div>
            {sessions.map((sess) => (
              <div key={sess.id} onClick={() => { setActiveSessionId(sess.id); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all group ${sess.id === activeSessionId ? 'bg-[#252525] text-[#FFD54F] border-l-2 border-[#FFD54F]' : 'text-[#BDBDBD] hover:bg-[#252525]/50 hover:text-[#F5F5F5]'}`}>
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <MessageSquare className="w-3.5 h-3.5 text-[#FFD54F] flex-shrink-0" />
                  <span className="truncate">{sess.title}</span>
                </div>
                {!sess.id.startsWith('session-') && (
                  <button onClick={(e) => handleDeleteSession(e, sess.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-[#333333] bg-[#121212] text-xs text-[#BDBDBD] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#FFD54F] font-medium text-[11px]"><ShieldCheck className="w-3.5 h-3.5" /><span>Sovereign Sandbox</span></div>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </div>
      </aside>

      <main className="flex-1 flex flex-col justify-between bg-gradient-to-br from-[#121212] to-[#0a0a0a] relative w-full overflow-hidden">
        <div className="h-14 border-b border-[#333333] bg-[#1A1A1A]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between text-xs text-[#BDBDBD] z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md text-[#BDBDBD] hover:text-[#FFD54F] hover:bg-[#252525] md:hidden transition-colors"><PanelLeftOpen className="w-5 h-5" /></button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFD54F] shadow-[0_0_8px_#FFD54F]"></span>
              <span className="font-bold text-[#F5F5F5] tracking-wide truncate max-w-[140px] sm:max-w-xs">{activeSession.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Cpu className="w-3.5 h-3.5 text-[#FFD54F] absolute left-3 pointer-events-none z-10" />
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value as any)} className="bg-[#252525]/80 text-[#FFD54F] border border-[#FFD54F]/30 pl-9 pr-8 py-1.5 rounded-full text-[11px] font-mono font-bold focus:outline-none focus:border-[#FFD54F] hover:bg-[#2F2F2F] transition-all appearance-none shadow-sm">
                <option value="anacleto-large">Anacleto-Large (Omni)</option>
                <option value="anacleto-medium">Anacleto-Medium (Balanced)</option>
                <option value="anacleto-small">Anacleto-Small (Compact)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#FFD54F] absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 max-w-5xl w-full mx-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 sm:gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && (
                <div className={`w-9 h-9 rounded-xl p-[1px] flex-shrink-0 bg-gradient-to-br from-[#FFD54F] to-[#f59e0b]`}>
                  <div className="w-full h-full bg-[#121212] rounded-[11px] flex items-center justify-center shadow-inner">
                    {msg.isError ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Bot className="w-5 h-5 text-[#FFD54F]" />}
                  </div>
                </div>
              )}
              <div className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-5 text-[13px] sm:text-sm leading-relaxed shadow-lg ${msg.sender === 'user' ? 'bg-gradient-to-br from-[#FFD54F] to-[#ffc107] text-[#000000] font-medium rounded-tr-none shadow-[#FFD54F]/20' : msg.isError ? 'bg-red-950/40 border border-red-800 text-red-200 rounded-tl-none' : 'bg-[#1e1e1e] border border-[#333333] text-[#F5F5F5] rounded-tl-none'}`}>
                <div className="flex items-center justify-between gap-4 mb-3 text-[11px] opacity-70 border-b border-current/10 pb-2 font-mono">
                  <span className="font-bold flex items-center gap-1.5">{msg.sender === 'user' ? 'You' : msg.modelUsed || 'Anacleto AI'}</span>
                  <div className="flex items-center gap-2">
                    {msg.latency && <span className="flex items-center gap-1 text-emerald-400 font-bold"><Zap className="w-3.5 h-3.5" />{msg.latency}</span>}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
                <div>{renderMessageContent(msg)}</div>
              </div>
              {msg.sender === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-[#252525] border border-[#333333] flex items-center justify-center text-[#F5F5F5] flex-shrink-0 shadow-md">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        <div className="p-4 sm:p-6 bg-gradient-to-t from-[#0a0a0a] to-transparent max-w-5xl w-full mx-auto pb-6">
          <div className="bg-[#1A1A1A]/90 backdrop-blur-xl border border-[#333333] rounded-2xl p-2 shadow-2xl">
            <div className="flex items-center gap-2 overflow-x-auto mb-2 px-2 pt-1 pb-2 border-b border-[#333333]/50">
              {[
                { label: 'Web', state: webSearchEnabled, set: setWebSearchEnabled, icon: Globe },
                { label: 'Think', state: deepReasoningEnabled, set: setDeepReasoningEnabled, icon: Brain },
                { label: 'Image', state: imageGenEnabled, set: setImageGenEnabled, icon: ImageIcon },
                { label: '3D', state: model3DEnabled, set: setModel3DEnabled, icon: Box },
                { label: 'PDF', state: pdfGenEnabled, set: setPdfGenEnabled, icon: BookOpen },
                { label: 'Slides', state: slideshowGenEnabled, set: setSlideshowGenEnabled, icon: Layout }
              ].map(t => (
                <button
                  key={t.label} type="button" onClick={() => t.set(!t.state)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${t.state ? 'bg-[#FFD54F] text-black shadow-sm' : 'bg-[#252525] text-[#BDBDBD] hover:text-white hover:bg-[#333]'}`}
                >
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>
            {selectedFile && (
              <div className="mb-2 mx-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#FFD54F]/40 text-xs text-[#FFD54F] font-mono shadow-md">
                <FileText className="w-3.5 h-3.5" />
                <span className="max-w-[200px] truncate font-bold">{selectedFile.name}</span>
                {extractedFileText && <span className="text-[10px] text-[#BDBDBD] bg-[#121212] px-1.5 py-0.5 rounded ml-1">{extractedFileText.length.toLocaleString()} chars</span>}
                <button onClick={() => { setSelectedFile(null); setExtractedFileText(''); }} className="text-[#888] hover:text-white ml-2">×</button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute left-2 p-2.5 rounded-xl text-[#BDBDBD] hover:text-[#FFD54F] hover:bg-[#252525] transition-colors"><Paperclip className="w-5 h-5" /></button>
              <textarea
                rows={1} value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                placeholder={`Ask ${selectedModel === 'anacleto-small' ? 'Anacleto-Small' : selectedModel === 'anacleto-medium' ? 'Anacleto-Medium' : 'Anacleto-Large'} to use tools or chat...`}
                className="w-full pl-14 pr-16 py-4 rounded-xl bg-transparent text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none resize-none"
              />
              <button type="submit" disabled={(!inputMessage.trim() && !selectedFile) || loading} className="absolute right-2 p-3 rounded-xl bg-gradient-to-r from-[#FFD54F] to-[#ffc107] hover:brightness-110 disabled:opacity-30 disabled:hover:brightness-100 text-[#000000] transition-all shadow-md">
                {loading ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : <Send className="w-4 h-4 font-bold ml-0.5" />}
              </button>
            </form>
          </div>
          <div className="flex items-center justify-center text-[10px] text-[#666] mt-3 font-mono">
            <span className="flex items-center gap-1.5 uppercase tracking-wider"><Sparkles className="w-3 h-3 text-[#FFD54F]/70" /> Multimodal Engine Sandbox</span>
          </div>
        </div>
      </main>

      {activeArtifact && <ArtifactCanvas isOpen={canvasOpen} onClose={() => setCanvasOpen(false)} title={activeArtifact.title} type={activeArtifact.type} content={activeArtifact.content} />}
    </div>
  );
};
