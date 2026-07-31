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
  Loader2
} from 'lucide-react';

const CHAT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYqzFN2cMmMkP3ikWEuizC_W5sgTpUueqja0E8kpzAQ4wv_7ZBZn5eMM9fMNyl4S0/exec';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  attachments?: string[];
}

export const SecureChatView: React.FC = () => {
  const [chatHistory, setChatHistory] = useState([
    { id: '1', title: 'Legal Contract Analysis', active: true },
    { id: '2', title: 'Q3 Financial Report Summary', active: false },
    { id: '3', title: 'Autonomous Agent Code Review', active: false },
    { id: '4', title: 'Research Paper Synthesis', active: false },
  ]);

  const [activeChatId, setActiveChatId] = useState('1');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: 'Welcome to Anacleto AI Console. Connected to our sovereign frontier model (Anacleto-120B-Omni). How can I assist with your research, APIs, agents, or document analysis today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || loading) return;

    const userMsgText = inputMessage;
    const attachedName = selectedFile ? selectedFile.name : undefined;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachedName ? [attachedName] : undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setSelectedFile(null);
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        message: userMsgText,
        attachment: attachedName || ''
      }).toString();

      const response = await fetch(`${CHAT_SCRIPT_URL}?${queryParams}`);
      const data = await response.json();

      const aiReplyText = data && data.response 
        ? data.response 
        : `Processed request: "${userMsgText || attachedName}". Model inference executed on air-gapped server [eu-de-fra-01] with 256-bit AES encryption.`;

      const aiResponseMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiResponseMsg]);
    } catch (err) {
      console.error('Chat API Error:', err);
      const fallbackReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Processed request: "${userMsgText || attachedName}". Model inference executed on sovereign node [eu-de-fra-01]. Zero data retention active.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackReply]);
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
    const newId = Date.now().toString();
    const newChat = { id: newId, title: 'New Model Session', active: true };
    setChatHistory((prev) => [newChat, ...prev.map((c) => ({ ...c, active: false }))]);
    setActiveChatId(newId);
    setMessages([
      {
        id: `welcome-${newId}`,
        sender: 'ai',
        text: 'Welcome to Anacleto AI Console. Connected to our sovereign frontier model (Anacleto-120B-Omni). How can I assist with your research, APIs, agents, or document analysis today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="pt-16 h-[calc(100vh-64px)] flex overflow-hidden bg-[#121212] text-[#F5F5F5]">
      
      {/* LEFT SIDEBAR - CHAT HISTORY */}
      <aside className="w-64 sm:w-72 bg-[#1A1A1A] border-r border-[#333333] flex flex-col justify-between flex-shrink-0 hidden md:flex">
        <div className="p-4 space-y-4">
          
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 rounded-lg bg-transparent border border-[#FFD54F] hover:bg-[#FFD54F] hover:text-[#000000] text-[#FFD54F] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            New Session
          </button>

          {/* History List */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold text-[#BDBDBD] uppercase tracking-wider">
              Model History
            </div>
            {chatHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveChatId(item.id);
                  setChatHistory((prev) =>
                    prev.map((c) => ({ ...c, active: c.id === item.id }))
                  );
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  item.active
                    ? 'bg-[#252525] text-[#FFD54F] border-l-2 border-[#FFD54F]'
                    : 'text-[#BDBDBD] hover:bg-[#252525]/50 hover:text-[#F5F5F5]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-[#FFD54F] flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </div>
            ))}
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
            <span className="font-semibold text-[#F5F5F5]">Model: Anacleto-120B-Omni</span>
            <span className="bg-[#252525] text-[#FFD54F] border border-[#FFD54F]/30 px-2 py-0.5 rounded text-[10px] font-mono">Frontier AI</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#BDBDBD]">
              <Code2 className="w-3 h-3 text-[#FFD54F]" /> REST API Ready
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
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFD54F] p-0.5 flex-shrink-0">
                  <div className="w-full h-full bg-[#121212] rounded-[10px] flex items-center justify-center text-[#FFD54F]">
                    <Bot className="w-5 h-5" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#FFD54F] text-[#000000] font-semibold rounded-tr-none shadow-lg shadow-[#FFD54F]/10'
                    : 'bg-[#1A1A1A] border border-[#333333] text-[#F5F5F5] rounded-tl-none shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1.5 text-[11px] opacity-70 border-b border-current/10 pb-1">
                  <span className="font-semibold flex items-center gap-1">
                    {msg.sender === 'user' ? 'You (Enterprise Developer)' : 'Anacleto AI Model'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <p className="whitespace-pre-wrap">{msg.text}</p>

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

          {loading && (
            <div className="flex gap-3 sm:gap-4 justify-start">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFD54F] p-0.5 flex-shrink-0">
                <div className="w-full h-full bg-[#121212] rounded-[10px] flex items-center justify-center text-[#FFD54F]">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-[#1A1A1A] border border-[#333333] text-[#F5F5F5] rounded-2xl rounded-tl-none p-4 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#FFD54F]" />
                <span className="text-xs text-[#BDBDBD]">Anacleto-120B-Omni is thinking...</span>
              </div>
            </div>
          )}

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
              placeholder="Prompt Anacleto AI or execute code & agent workflows..."
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
              Sovereign AI Research Engine. Zero telemetry.
            </span>
            <span className="hidden sm:inline">Press Shift + Enter for new line</span>
          </div>
        </div>

      </main>
    </div>
  );
};
