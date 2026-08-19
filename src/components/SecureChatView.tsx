import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Paperclip, Send, ShieldCheck, MessageSquare, Plus, Bot, User, 
  ChevronRight, Sparkles, Lock, Loader2, Zap, AlertCircle, Copy, Check, 
  PanelLeftOpen, PanelLeftClose, FileText, Globe, Brain, Layout, 
  ChevronDown, ChevronUp, Cpu, Trash2, Image as ImageIcon, Box, BookOpen, Download, Maximize2, XCircle, Pencil
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
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

interface ArtifactData {
  title: string;
  type: 'code' | 'html' | 'svg' | 'markdown';
  content: string;
}

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
  artifacts?: ArtifactData[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
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

  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    if (isConfigured && session?.user) {
      const loadSessions = async () => {
        const { data: dbSessions } = await supabase.from('chat_sessions').select('*').order('created_at', { ascending: false });
        if (dbSessions && dbSessions.length > 0) {
          const formatted: ChatSession[] = [];
          for (const s of dbSessions) {
            const { data: msgs } = await supabase.from('chat_messages').select('*').eq('session_id', s.id).order('created_at', { ascending: true });
            formatted.push({
              id: s.id,
              title: s.title || 'Conversation',
              createdAt: new Date(s.created_at).toLocaleTimeString(),
              messages: (msgs || []).map((m: any) => {
                let parsedText = m.text || '';
                let extra: any = {};
                if (m.sender === 'ai' && typeof parsedText === 'string' && parsedText.startsWith('{')) {
                  try {
                    const parsed = JSON.parse(parsedText);
                    if (parsed.text !== undefined) {
                      parsedText = parsed.text;
                      extra = parsed;
                    }
                  } catch (e) {}
                }
                return {
                  id: m.id,
                  sender: m.sender,
                  text: parsedText,
                  timestamp: new Date(m.created_at).toLocaleTimeString(),
                  thoughts: extra.thoughts,
                  images: extra.images,
                  models3D: extra.models3D,
                  latexBlocks: extra.latexBlocks,
                  searchSummary: extra.searchSummary,
                  sources: extra.sources,
                  artifacts: extra.artifacts
                };
              })
            });
            loadedSessionIds.current.add(s.id);
          }
          setSessions(formatted);
          setActiveSessionId(formatted[0].id);
        } else {
          setSessions([{
            id: 'session-1',
            title: 'New Conversation',
            createdAt: new Date().toLocaleTimeString(),
            messages: []
          }]);
        }
      };
      loadSessions();
    } else {
      setSessions([{
        id: 'session-1',
        title: 'New Conversation',
        createdAt: new Date().toLocaleTimeString(),
        messages: []
      }]);
    }
  }, [isConfigured, session]);

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastStepTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const loadedSessionIds = useRef<Set<string>>(new Set());

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || {
    id: 'session-1', title: 'New Chat', createdAt: new Date().toLocaleTimeString(), messages: []
  };
  const messages = activeSession.messages;

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
          const pdfjsLib = await import('pdfjs-dist');
          if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
          }
          
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) { 
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

  const handleEditMessage = (msg: ChatMessage) => {
    setInputMessage(msg.text);
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const msgIndex = s.messages.findIndex(m => m.id === msg.id);
      return { ...s, messages: s.messages.slice(0, msgIndex) };
    }));
    setTimeout(() => {
       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

    isStreamingRef.current = true;

    abortControllerRef.current = new AbortController();
    try {
      const historyContext = activeSession.messages.map((m) => ({ sender: m.sender, text: m.text, id: m.id }));
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ message: userMsgText, attachment: attachedName || '', fileContent: attachedContent || '', webSearch: webSearchEnabled, deepReasoning: deepReasoningEnabled, imageGen: imageGenEnabled, model3D: model3DEnabled, pdfGen: pdfGenEnabled, slideshowGen: slideshowGenEnabled, model: activeModelKey, history: historyContext }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      let finalAiText = '';
      let finalThoughts = '';
      let finalImages: string[] = [];
      let finalModels3D: any[] = [];
      let finalLatexBlocks: any[] = [];
      let finalSearchSummary = '';
      let finalSources: string[] = [];
      let finalArtifacts: ArtifactData[] = [];

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
                   finalAiText += eventData.chunk;
                   setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                     ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, text: (m.text || '') + eventData.chunk } : m)
                   } : s));
                } else if (eventType === 'reasoning' && eventData.chunk) {
                   finalThoughts += eventData.chunk;
                   setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                     ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, thoughts: (m.thoughts || '') + eventData.chunk } : m)
                   } : s));
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
                  finalImages.push(eventData.base64);
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, images: [...(m.images || []), eventData.base64] } : m)
                  } : s));
                } else if (eventType === 'model_3d_generated') {
                  finalModels3D.push(eventData.result);
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, models3D: [...(m.models3D || []), eventData.result] } : m)
                  } : s));
                } else if (eventType === 'latex_generated') {
                  finalLatexBlocks.push({ code: eventData.code, isSlideshow: eventData.isSlideshow });
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, latexBlocks: [...(m.latexBlocks || []), { code: eventData.code, isSlideshow: eventData.isSlideshow }] } : m)
                  } : s));
                } else if (eventType === 'artifact_generated') {
                  const newArtifact: ArtifactData = { title: eventData.title, type: eventData.type, content: eventData.content };
                  finalArtifacts.push(newArtifact);
                  setActiveArtifact(newArtifact);
                  setCanvasOpen(true);
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, artifacts: [...(m.artifacts || []), newArtifact] } : m)
                  } : s));
                } else if (eventType === 'searchSummary') {
                  finalSearchSummary = eventData.summary;
                  finalSources = eventData.sources || [];
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, searchSummary: eventData.summary, sources: eventData.sources } : m)
                  } : s));
                } else if (eventType === 'done') {
                   isStreamingRef.current = false;
                   setLoading(false);
                   
                   if (isConfigured && session?.user && !currentSessionId.startsWith('session-')) {
                     const aiPayload = {
                       text: finalAiText,
                       thoughts: finalThoughts,
                       images: finalImages,
                       models3D: finalModels3D,
                       latexBlocks: finalLatexBlocks,
                       searchSummary: finalSearchSummary,
                       sources: finalSources,
                       artifacts: finalArtifacts
                     };
                     supabase.from('chat_messages').insert({
                       session_id: currentSessionId,
                       sender: 'ai',
                       text: JSON.stringify(aiPayload)
                     }).then();
                   }
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
      messages: []
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

  const renderInputBox = () => (
    <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-2 sm:p-3 shadow-2xl relative">
      <div className="flex items-center gap-2 overflow-x-auto mb-2 px-2 pt-1 pb-2 border-b border-zinc-800/50">
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
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap border ${t.state ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm' : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-300'}`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>
      {selectedFile && (
        <div className="mb-2 mx-2 inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 font-mono">
          <FileText className="w-3.5 h-3.5" />
          <span className="max-w-[150px] truncate">{selectedFile.name}</span>
          {extractedFileText && <span className="text-[10px] text-zinc-500 bg-black/50 px-1.5 py-0.5 rounded">{extractedFileText.length.toLocaleString()} chars</span>}
          <button onClick={() => { setSelectedFile(null); setExtractedFileText(''); }} className="text-zinc-500 hover:text-red-400 ml-2 transition-colors"><XCircle className="w-4 h-4" /></button>
        </div>
      )}
      <div className="relative flex items-end">
        <form onSubmit={handleSendMessage} className="relative flex w-full items-end">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 mb-1 ml-1 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"><Paperclip className="w-5 h-5" /></button>
          <textarea
            rows={Math.min(8, Math.max(1, inputMessage.split('\n').length))}
            value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
            placeholder="Send a message to Anacleto..."
            className="w-full px-3 py-4 bg-transparent text-zinc-100 placeholder-zinc-600 text-[15px] focus:outline-none resize-none max-h-[200px]"
          />
          <button type={loading ? "button" : "submit"} onClick={() => loading ? abortControllerRef.current?.abort() : undefined} disabled={(!inputMessage.trim() && !selectedFile && !loading)} className={`p-2.5 mb-1.5 mr-1.5 rounded-xl transition-all ${loading ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 hover:bg-white disabled:opacity-20 text-black'}`}>
            {loading ? <XCircle className="w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );

  const renderMessageContent = (msg: ChatMessage) => {
    const msgId = msg.id;
    let cleanText = msg.text || '';
    const thoughtsText = msg.thoughts || '';

    if (!cleanText && !thoughtsText && !msg.searchSummary && !msg.activeTool && (!msg.executedTools || msg.executedTools.length === 0) && !msg.images && !msg.models3D && !msg.latexBlocks && !msg.artifacts) {
      return (
        <div className="flex items-center gap-3 text-xs text-zinc-400 py-1 font-mono">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="uppercase tracking-wider">Processing...</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {msg.activeTool && (
          <div className="flex items-center gap-3 text-xs text-zinc-300 py-3 px-4 rounded-xl bg-zinc-800/50 font-mono border border-zinc-700 mb-3">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            <span className="uppercase font-bold tracking-widest">Executing {msg.activeTool.replace('_', ' ')}...</span>
          </div>
        )}

        {msg.executedTools && msg.executedTools.length > 0 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono overflow-hidden my-3 shadow-sm">
            <button
              onClick={() => setOpenSearchId(openSearchId === msgId ? null : msgId)}
              className="w-full px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-between text-zinc-400 transition-colors"
            >
              <span className="flex items-center gap-2 font-bold uppercase tracking-widest text-[11px] text-zinc-300">
                <Cpu className="w-4 h-4" /> Executed Tools ({msg.executedTools.length})
              </span>
              {openSearchId === msgId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSearchId === msgId && (
              <div className="p-4 text-zinc-400 bg-[#0b0b0d] border-t border-zinc-800 leading-relaxed flex flex-col gap-3">
                {msg.executedTools.map((t, idx) => (
                   <div key={idx} className="flex flex-col gap-1.5 border-b border-zinc-800 pb-3 mb-1 last:border-0 last:mb-0 last:pb-0">
                      <span className="text-zinc-200 font-bold capitalize tracking-wider">{t.name.replace('_', ' ')}</span>
                      <span className="opacity-70 text-[10px] break-all bg-black/40 p-2 rounded border border-zinc-800">{JSON.stringify(t.args)}</span>
                      {t.status === 'loading' && <span className="flex items-center gap-1.5 text-blue-400 text-[10px] mt-1 uppercase font-bold"><Loader2 className="w-3 h-3 animate-spin"/> Running</span>}
                      {t.status === 'done' && <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] mt-1 uppercase font-bold"><Check className="w-3 h-3"/> Completed</span>}
                   </div>
                ))}
              </div>
            )}
          </div>
        )}

        {thoughtsText && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono overflow-hidden my-3 shadow-sm">
            <button
              onClick={() => setOpenThinkId(openThinkId === msgId ? null : msgId)}
              className="w-full px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-between text-zinc-400 transition-colors"
            >
              <span className="flex items-center gap-2 font-bold uppercase tracking-widest text-[11px] text-zinc-300">
                <Brain className="w-4 h-4" /> Reasoning Process
              </span>
              {openThinkId === msgId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openThinkId === msgId && (
              <div className="p-4 text-zinc-400 bg-[#0b0b0d] border-t border-zinc-800 leading-relaxed whitespace-pre-wrap">
                {thoughtsText}
              </div>
            )}
          </div>
        )}

        {msg.searchSummary && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono overflow-hidden my-3 shadow-sm">
            <button
              onClick={() => setOpenSearchId(openSearchId === msgId ? null : msgId)}
              className="w-full px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-between text-zinc-400 transition-colors"
            >
              <span className="flex items-center gap-2 font-bold uppercase tracking-widest text-[11px] text-zinc-300">
                <Globe className="w-4 h-4" /> Web Search Sources ({msg.sources?.length || 0})
              </span>
              {openSearchId === msgId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSearchId === msgId && (
              <div className="p-4 text-zinc-400 bg-[#0b0b0d] border-t border-zinc-800 leading-relaxed whitespace-pre-wrap">
                {msg.searchSummary}
              </div>
            )}
          </div>
        )}

        {msg.artifacts && msg.artifacts.length > 0 && (
           <div className="flex flex-col gap-3 my-4">
             {msg.artifacts.map((art, idx) => (
               <div key={idx} className="bg-zinc-900 rounded-xl p-4 flex items-center justify-between border border-zinc-800 shadow-sm">
                 <div className="flex items-center gap-4 text-zinc-300">
                   <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                     <Box className="w-5 h-5" />
                   </div>
                   <div>
                     <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Interactive Artifact</div>
                     <div className="text-sm font-bold text-zinc-100">{art.title}</div>
                   </div>
                 </div>
                 <button onClick={() => { setActiveArtifact(art); setCanvasOpen(true); }} className="px-4 py-2 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-extrabold uppercase tracking-widest rounded-lg transition-all border border-zinc-600 shadow-sm">
                   Open
                 </button>
               </div>
             ))}
           </div>
        )}

        {msg.images && msg.images.length > 0 && (
           <div className="flex flex-wrap gap-4 my-4">
              {msg.images.map((imgBase64, idx) => (
                 <div key={idx} className="relative group rounded-2xl overflow-hidden border border-zinc-700 shadow-lg">
                   <img src={`data:image/jpeg;base64,${imgBase64}`} alt="Generated visual" className="w-72 h-72 object-cover" />
                   <a href={`data:image/jpeg;base64,${imgBase64}`} download={`generated_image_${idx}.jpg`} className="absolute top-3 right-3 bg-black/60 backdrop-blur p-2 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black hover:scale-105 shadow-xl">
                     <Download className="w-5 h-5" />
                   </a>
                 </div>
              ))}
           </div>
        )}

        {msg.models3D && msg.models3D.length > 0 && (
           <div className="flex flex-col gap-4 my-4">
              {msg.models3D.map((res, idx) => {
                 let glbUrl = typeof res === 'string' && res.startsWith('http') ? res : (res?.model_url || '');
                 if (typeof res === 'string' && res.length > 1000 && !res.startsWith('http')) {
                    glbUrl = `data:model/gltf-binary;base64,${res}`;
                 }
                 return glbUrl ? (
                   <div key={idx} className="h-72 w-full max-w-md rounded-2xl overflow-hidden border border-zinc-700 bg-gradient-to-b from-[#1a1a1c] to-[#0b0b0d] shadow-lg">
                     <ModelViewer src={glbUrl} auto-rotate camera-controls style={{ width: '100%', height: '100%' }} />
                   </div>
                 ) : (
                   <div key={idx} className="p-4 bg-zinc-900 text-xs border border-zinc-800 rounded-xl text-zinc-400 font-mono">
                     <span className="text-zinc-300 block mb-2 uppercase font-bold tracking-widest text-[10px]">3D Data Generated (Raw):</span>
                     {JSON.stringify(res).slice(0, 200)}...
                   </div>
                 );
              })}
           </div>
        )}

        {msg.latexBlocks && msg.latexBlocks.length > 0 && (
           <div className="flex flex-col gap-5 my-5">
              {msg.latexBlocks.map((block, idx) => {
                 const pdfUrl = `https://latexonline.cc/compile?text=${encodeURIComponent(block.code)}`;
                 return (
                 <div key={idx} className="bg-zinc-900 rounded-2xl overflow-hidden shadow-lg border border-zinc-800">
                   <div className="bg-[#1a1a1c] p-3.5 flex justify-between items-center border-b border-zinc-800">
                     <div className="flex items-center gap-4">
                       <div className="flex gap-1.5 ml-2">
                         <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm" />
                         <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-sm" />
                         <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-sm" />
                       </div>
                       <span className="flex items-center gap-2 font-mono font-bold uppercase tracking-widest text-xs text-zinc-300">
                         <BookOpen className="w-4 h-4" /> 
                         {block.isSlideshow ? 'Presentation Viewer' : 'Document Viewer'}
                       </span>
                     </div>
                     <button onClick={() => window.open(pdfUrl, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 font-extrabold uppercase tracking-widest text-[10px] rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 shadow-sm">
                       <Maximize2 className="w-3.5 h-3.5"/> Full Screen
                     </button>
                   </div>
                   <div className="w-full h-[650px] bg-zinc-100">
                     <iframe src={pdfUrl} className="w-full h-full border-0" title="PDF Viewer" />
                   </div>
                 </div>
                 );
              })}
           </div>
        )}

        {cleanText && (
          <div className="text-[15px] text-zinc-200 font-sans w-full max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 mt-6 text-white tracking-tight" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl sm:text-2xl font-bold mb-3 mt-5 text-white tracking-tight" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg sm:text-xl font-semibold mb-3 mt-4 text-white" {...props} />,
                h4: ({node, ...props}) => <h4 className="text-base sm:text-lg font-semibold mb-2 mt-3 text-zinc-100" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4 space-y-1.5 marker:text-zinc-500" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4 space-y-1.5 marker:text-zinc-500" {...props} />,
                li: ({node, ...props}) => <li className="text-zinc-200 leading-relaxed" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 leading-relaxed last:mb-0" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-zinc-600 pl-4 py-1 italic text-zinc-400 my-4 bg-zinc-900/50 rounded-r-lg" {...props} />,
                table: ({node, ...props}) => <div className="overflow-x-auto mb-4 border border-zinc-800 rounded-lg"><table className="min-w-full divide-y divide-zinc-800 text-sm" {...props} /></div>,
                th: ({node, ...props}) => <th className="px-4 py-3 text-left font-bold text-zinc-300 uppercase tracking-wider bg-zinc-900" {...props} />,
                td: ({node, ...props}) => <td className="px-4 py-3 text-zinc-300 border-t border-zinc-800 bg-[#121214]/50" {...props} />,
                a: ({node, ...props}) => <a className="text-[#FFD54F] hover:text-amber-400 underline underline-offset-4 decoration-amber-500/30 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <div className="my-5 rounded-lg overflow-hidden bg-[#121214] border border-zinc-800 text-xs font-mono shadow-sm">
                      <div className="bg-[#1a1a1c] px-4 py-2.5 flex items-center justify-between border-b border-zinc-800 text-zinc-400">
                        <span className="text-[11px] uppercase tracking-widest font-bold">{match[1]}</span>
                        <Copy className="w-3.5 h-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), msgId)} />
                      </div>
                      <pre className="p-4 overflow-x-auto text-zinc-300 leading-relaxed selection:bg-zinc-700">
                        <code className={className} {...props}>{children}</code>
                      </pre>
                    </div>
                  ) : (
                    <code className="bg-zinc-800/80 text-zinc-200 px-1.5 py-0.5 rounded font-mono text-[13px] border border-zinc-700/50" {...props}>{children}</code>
                  )
                }
              }}
            >
              {cleanText}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-[#0b0b0d] text-zinc-100 relative font-sans selection:bg-zinc-700 selection:text-white">
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden" />}

      <aside className={`w-64 sm:w-72 bg-[#121214] border-r border-zinc-800 flex flex-col justify-between flex-shrink-0 z-40 transition-transform duration-300 md:static fixed inset-y-0 left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 space-y-5">
          <button onClick={handleNewChat} className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 group shadow-sm border border-zinc-700">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> New Session
          </button>
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Conversations</div>
            {sessions.map((sess) => (
              <div key={sess.id} onClick={() => { setActiveSessionId(sess.id); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all group ${sess.id === activeSessionId ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}>
                <div className="flex items-center gap-3 truncate flex-1 min-w-0">
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${sess.id === activeSessionId ? 'text-zinc-300' : 'text-zinc-500'}`} />
                  <span className="truncate tracking-wide">{sess.title}</span>
                </div>
                {!sess.id.startsWith('session-') && (
                  <button onClick={(e) => handleDeleteSession(e, sess.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-opacity"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 border-t border-zinc-800 bg-[#0b0b0d] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-400 font-extrabold uppercase tracking-widest text-[10px]"><ShieldCheck className="w-4 h-4" /><span>Sovereign</span></div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative w-full overflow-hidden bg-[#0b0b0d]">
        <div className="h-16 border-b border-zinc-800 bg-[#0b0b0d]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 md:hidden transition-colors"><PanelLeftOpen className="w-5 h-5" /></button>
            <div className="flex items-center gap-3">
              <span className="font-bold text-zinc-100 tracking-wide truncate max-w-[140px] sm:max-w-xs text-sm">{activeSession.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value as any)} className="bg-transparent text-zinc-300 pr-8 py-2 text-xs font-mono font-bold focus:outline-none transition-all appearance-none cursor-pointer uppercase tracking-wider hover:text-white">
                <option value="anacleto-large">Anacleto-Large</option>
                <option value="anacleto-medium">Anacleto-Medium</option>
                <option value="anacleto-small">Anacleto-Small</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-1 pointer-events-none" />
            </div>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 w-full">
            <div className="mb-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight mb-2">What will you build today?</h2>
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Sovereign Foundation Models</p>
            </div>
            <div className="w-full max-w-3xl">
              {renderInputBox()}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto w-full scroll-smooth">
              <div className="max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-10 pb-8">
                {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 sm:gap-6 w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-1 border border-zinc-700">
                      {msg.isError ? <AlertCircle className="w-4 h-4 text-red-500" /> : <Bot className="w-4 h-4 text-zinc-300" />}
                    </div>
                  )}
                  <div className={`group relative ${msg.sender === 'user' ? 'max-w-[85%] sm:max-w-[75%] rounded-3xl p-5 bg-[#1a1a1c] text-zinc-100 border border-zinc-800 shadow-sm' : 'max-w-full text-zinc-100 pt-0.5 flex-1'}`}>
                    <div className="flex items-center justify-between gap-4 mb-2 text-[11px] opacity-60 font-mono">
                      <span className="font-bold uppercase tracking-widest">{msg.sender === 'user' ? 'You' : msg.modelUsed || 'Anacleto'}</span>
                      <div className="flex items-center gap-3">
                        {msg.latency && <span className="flex items-center gap-1.5 text-emerald-400 font-bold"><Zap className="w-3.5 h-3.5" />{msg.latency}</span>}
                      </div>
                    </div>
                    <div className="w-full">{renderMessageContent(msg)}</div>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="flex flex-col items-center gap-2 mt-1">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <button onClick={() => handleEditMessage(msg)} className="p-2 rounded-full text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100" title="Edit Message">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
                <div ref={messagesEndRef} className="h-6" />
              </div>
            </div>

            <div className="w-full p-4 sm:p-6 bg-gradient-to-t from-[#0b0b0d] via-[#0b0b0d] to-transparent flex justify-center z-20 mt-auto">
              <div className="w-full max-w-4xl">
                {renderInputBox()}
              </div>
            </div>
          </>
        )}
      </main>

      {activeArtifact && <ArtifactCanvas isOpen={canvasOpen} onClose={() => setCanvasOpen(false)} title={activeArtifact.title} type={activeArtifact.type} content={activeArtifact.content} />}
    </div>
  );
};
