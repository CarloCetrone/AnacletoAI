import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, UploadCloud, MessageSquare, Check, FileText, Send, Loader2, PlayCircle, PlusCircle, Maximize2, Trash2, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export const EducatorCenterView: React.FC = () => {
  const { session, user } = useAuth();
  
  // UI States
  const [step, setStep] = useState<number>(0); // 0 = dashboard, 1 = setup, 2 = refine, 3 = published
  const [lessons, setLessons] = useState<any[]>([]);
  
  // Creation States
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [material, setMaterial] = useState('');
  const [activeLatex, setActiveLatex] = useState('');
  
  // Chat States
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [publishing, setPublishing] = useState(false);
  const GENERATE_LESSON_URL = 'https://zzlptwfqqnjhxtvmebqb.supabase.co/functions/v1/generate-lesson';

  useEffect(() => {
    if (user) {
      fetchLessons();
    }
  }, [user]);

  // Submit PDF form when switching to PDF view and generation is complete
  useEffect(() => {
    if (!showCode && activeLatex && activeLatex.includes('\\end{document}')) {
      const timer = setTimeout(() => {
        const form = document.getElementById('latex-form') as HTMLFormElement;
        if (form) form.submit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showCode, activeLatex]);

  const fetchLessons = async () => {
    const { data } = await supabase.from('lessons').select('*').eq('educator_id', user?.id).order('created_at', { ascending: false });
    if (data) setLessons(data);
  };

  const handleDeleteLesson = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (!error) {
      setLessons(prev => prev.filter(l => l.id !== id));
    } else {
      alert("Error deleting lesson: " + error.message);
    }
  };

  const startNewLesson = () => {
    setTitle('');
    setPrompt('');
    setMaterial('');
    setActiveLatex('');
    setChatMessages([]);
    setStep(1);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setIsLoading(true);
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
          if (!res.ok) throw new Error('Failed to parse PDF');
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setMaterial((prev) => prev + "\n" + (data.text || '').slice(0, 50000));
        } catch (err: any) {
          alert('Error parsing PDF: ' + err.message);
        } finally {
          setIsLoading(false);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          setMaterial((prev) => prev + "\n" + (event.target?.result as string).slice(0, 50000));
        };
        reader.readAsText(file);
      }
    }
  };

  const startGeneration = async () => {
    if (!title || (!prompt && !material)) return;
    setStep(2);
    handleSendChat('Please generate the initial lesson plan based on my instructions and material.');
  };

  const handleSendChat = async (overrideMsg?: string) => {
    const msgToSend = overrideMsg || inputMsg;
    if (!msgToSend.trim() || isLoading) return;
    
    setInputMsg('');
    const newMessages = [...chatMessages, { sender: 'user', text: msgToSend }];
    setChatMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch(GENERATE_LESSON_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          message: overrideMsg ? null : msgToSend,
          materialContent: overrideMsg ? material : null,
          educatorPrompt: overrideMsg ? prompt : null,
          title: title,
          history: newMessages.slice(0, -1),
          currentLatex: activeLatex
        })
      });

      if (!res.ok) throw new Error('Generation failed');
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let aiText = '';
      let latestLatex = activeLatex;

      setChatMessages((prev) => [...prev, { sender: 'ai', text: '', id: 'temp' }]);

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
                setChatMessages((prev) => prev.map(m => m.id === 'temp' ? { ...m, text: aiText } : m));
                
                const match = aiText.match(/```(?:latex)?\n([\s\S]*?)(?:```|$)/);
                if (match) {
                  latestLatex = match[1];
                  setActiveLatex(latestLatex);
                }
                
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              } else if (eventType === 'latex_updated') {
                latestLatex = data.latex;
                setActiveLatex(latestLatex);
              }
            }
          }
        }
      }
      setChatMessages((prev) => prev.map(m => m.id === 'temp' ? { ...m, id: Date.now().toString() } : m));
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [...prev.filter(m => m.id !== 'temp'), { sender: 'ai', text: 'Error connecting to the generation service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const publishLesson = async () => {
    if (!activeLatex) return;
    setPublishing(true);
    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { data, error } = await supabase.from('lessons').insert({
      educator_id: user?.id,
      title: title,
      access_key: key,
      source_material: material,
      educator_prompt: prompt,
      generated_plan: activeLatex,
      status: 'published'
    }).select().single();
    
    setPublishing(false);
    if (!error && data) {
      setStep(3);
      fetchLessons();
    } else {
      alert("Error publishing lesson: " + error?.message);
    }
  };

  // -------------------------------------------------------------
  // STEP 1: SETUP
  // -------------------------------------------------------------
  if (step === 1) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#121212] text-zinc-100 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-[#1A1A1A] border border-[#333333] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-[#FFD54F]" />
            <div>
              <h2 className="text-2xl font-extrabold text-[#F5F5F5] uppercase tracking-wider">Create New Lesson</h2>
              <p className="text-xs text-[#BDBDBD] mt-1 font-mono">Initialize your AI pedagogical assistant</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-[#BDBDBD] mb-2 tracking-wider">Lesson Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#121212] border border-[#333333] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFD54F] text-[#F5F5F5] transition-colors" placeholder="e.g. Introduction to Quantum Physics" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase text-[#BDBDBD] tracking-wider">Source Material</label>
                <span className="text-[10px] text-[#666666] font-mono">Text / CSV / Logs</span>
              </div>
              <div className="relative">
                <textarea rows={5} value={material} onChange={e => setMaterial(e.target.value)} className="w-full bg-[#121212] border border-[#333333] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFD54F] text-[#F5F5F5] resize-none transition-colors" placeholder="Paste syllabi, text logs, or lecture notes here..." />
                <label className="absolute bottom-3 right-3 p-2 bg-[#252525] hover:bg-[#333333] rounded-lg cursor-pointer border border-[#333333] transition-colors flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-[#FFD54F]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#BDBDBD]">Upload File</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#BDBDBD] mb-2 tracking-wider">Pedagogical Instructions</label>
              <textarea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full bg-[#121212] border border-[#333333] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFD54F] text-[#F5F5F5] resize-none transition-colors" placeholder="e.g. Explain concepts using real-world examples, include a quiz at the end..." />
            </div>

            <div className="flex justify-end gap-4 pt-6 mt-2 border-t border-[#333333]">
              <button onClick={() => setStep(0)} className="px-6 py-3 rounded-xl bg-[#252525] border border-[#333333] text-[#BDBDBD] hover:text-[#F5F5F5] font-bold text-xs uppercase tracking-wider transition-colors">Cancel</button>
              <button onClick={startGeneration} disabled={!title || (!prompt && !material)} className="flex-1 max-w-[250px] py-3 rounded-xl bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Generate Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 2: CHAT REFINE
  // -------------------------------------------------------------
  if (step === 2) {
    return (
      <div className="h-[calc(100vh-64px)] flex bg-[#121212] text-[#F5F5F5] overflow-hidden pt-16">
        {/* Chat Left Side */}
        <div className="w-[450px] flex flex-col border-r border-[#333333] bg-[#1A1A1A]">
          <div className="p-4 border-b border-[#333333] bg-[#121212] flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#FFD54F]" />
              AI Co-Pilot
            </h3>
            <button onClick={publishLesson} disabled={!activeLatex || isLoading || publishing} className="px-4 py-2 bg-[#FFD54F] hover:bg-[#FFCA28] text-black rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-colors">
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth bg-[#121212]">
            {chatMessages.map((msg, i) => {
              if (msg.id === 'temp' && !msg.text) return null;
              
              const displayMsg = msg.sender === 'ai' 
                ? (msg.text.includes('```') ? "\n\n> 📄 **LaTeX Document Generated (See Right Panel)**\n\n" : msg.text)
                : msg.text;
                
              return (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-xl text-sm border ${
                    msg.sender === 'user' 
                      ? 'bg-[#252525] border-[#333333] text-[#F5F5F5] rounded-tr-sm' 
                      : 'bg-[#1A1A1A] border-[#333333] text-[#BDBDBD] rounded-tl-sm'
                  }`}>
                    <div className="prose prose-invert max-w-none text-sm prose-p:leading-relaxed">
                      <ReactMarkdown>{displayMsg}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="max-w-[85%] p-4 rounded-xl rounded-tl-sm bg-[#1A1A1A] border border-[#333333] text-[#BDBDBD] flex items-center gap-3">
                   <Loader2 className="w-4 h-4 animate-spin text-[#FFD54F]" />
                   <span className="text-xs font-mono">Synthesizing...</span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-[#333333] bg-[#1A1A1A]">
            <div className="relative flex items-center bg-[#121212] border border-[#333333] rounded-xl focus-within:border-[#FFD54F] transition-colors">
              <input type="text" value={inputMsg} onChange={e => setInputMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="Ask to modify the lesson..." className="flex-1 bg-transparent pl-4 pr-12 py-3.5 text-sm focus:outline-none text-[#F5F5F5] placeholder:text-[#666666]" />
              <button onClick={() => handleSendChat()} disabled={isLoading || !inputMsg.trim()} className="absolute right-2 p-2 rounded-lg bg-[#252525] text-[#BDBDBD] hover:text-[#FFD54F] disabled:opacity-50 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Latex Right Side */}
        <div className="flex-1 flex flex-col relative bg-[#121212]">
          {activeLatex && (
            <div className="absolute top-4 right-4 z-10 flex bg-[#1A1A1A] border border-[#333333] rounded-lg overflow-hidden shadow-lg">
              <button 
                onClick={() => setShowCode(false)} 
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${!showCode ? 'bg-[#FFD54F] text-black' : 'text-[#BDBDBD] hover:text-[#F5F5F5] hover:bg-[#252525]'}`}
              >
                <FileText className="w-4 h-4" /> PDF View
              </button>
              <button 
                onClick={() => setShowCode(true)} 
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${showCode ? 'bg-[#FFD54F] text-black' : 'text-[#BDBDBD] hover:text-[#F5F5F5] hover:bg-[#252525]'}`}
              >
                <Code className="w-4 h-4" /> LaTeX Code
              </button>
            </div>
          )}
          
          {activeLatex ? (
            showCode ? (
              <div className="w-full h-full flex flex-col p-4 pt-16 bg-[#121212]">
                <textarea 
                  value={activeLatex} 
                  onChange={e => setActiveLatex(e.target.value)} 
                  className="w-full h-full bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 font-mono text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FFD54F] resize-none"
                  spellCheck="false"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-white relative">
                {activeLatex.includes('\\end{document}') ? (
                  <>
                    <form id="latex-form" target="pdf-frame" action="https://texlive.net/cgi-bin/latexcgi" method="POST" encType="multipart/form-data" className="hidden">
                      <textarea name="filecontents[]" value={activeLatex} readOnly />
                      <input type="hidden" name="filename[]" value="document.tex" />
                      <input type="hidden" name="engine" value="pdflatex" />
                      <input type="hidden" name="return" value="pdf" />
                    </form>
                    <iframe name="pdf-frame" className="w-full h-full border-0" title="PDF Preview" />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#1A1A1A] text-[#BDBDBD]">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#FFD54F]" />
                    <p className="font-mono text-xs uppercase tracking-widest text-center px-6">Waiting for document to finish generating<br/>before compiling PDF...</p>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#121212]">
               <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#FFD54F]" />
               <p className="font-mono text-xs uppercase tracking-widest text-[#BDBDBD]">Generating Document...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 3: PUBLISHED
  // -------------------------------------------------------------
  if (step === 3) {
    const latestLesson = lessons[0];
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#121212] flex items-center justify-center">
        <div className="max-w-md w-full bg-[#1A1A1A] border border-[#333333] rounded-2xl p-10 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6">
             <Check className="w-8 h-8 text-emerald-400" />
          </div>
          
          <h2 className="text-2xl font-extrabold text-[#F5F5F5] uppercase tracking-wider mb-2">Lesson Published!</h2>
          <p className="text-xs text-[#BDBDBD] mb-8 font-mono">Share the access key below with your students.</p>
          
          <div className="bg-[#121212] border border-[#FFD54F]/50 rounded-xl p-6 mb-8">
             <div className="text-[10px] font-bold uppercase text-[#FFD54F] mb-2 tracking-widest">Access Key</div>
             <div className="text-3xl font-mono font-bold tracking-widest text-[#F5F5F5]">{latestLesson?.access_key || 'WAITING...'}</div>
          </div>
          
          <button onClick={() => setStep(0)} className="w-full px-6 py-4 rounded-xl bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-bold text-xs uppercase tracking-widest transition-colors">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 0: DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#121212] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFD54F] flex items-center justify-center text-black">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] uppercase tracking-tight">Educator Center</h1>
              <p className="text-xs text-[#BDBDBD] mt-1 font-mono uppercase tracking-widest">Curriculum & Lesson Setup</p>
            </div>
          </div>
          <button onClick={startNewLesson} className="px-5 py-3 rounded-xl bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> New Lesson Plan
          </button>
        </div>

        {/* Active Syllabi Section */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-extrabold text-[#F5F5F5] uppercase tracking-wider mb-6 flex items-center gap-2">
             <FileText className="w-5 h-5 text-[#FFD54F]" /> Active Syllabi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map(lesson => (
              <div key={lesson.id} className="bg-[#121212] border border-[#333333] rounded-xl p-6 hover:border-[#FFD54F] transition-colors cursor-pointer flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-base font-bold text-[#F5F5F5] pr-4 line-clamp-2">{lesson.title}</h3>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${lesson.status === 'published' ? 'bg-[#FFD54F]/10 text-[#FFD54F] border-[#FFD54F]/20' : 'bg-[#252525] text-[#BDBDBD] border-[#333333]'}`}>
                    {lesson.status}
                  </span>
                </div>
                
                <div className="flex-1"></div>
                
                <div className="mt-4 pt-4 border-t border-[#333333] flex items-center justify-between">
                   <div className="text-xs text-[#666666] font-mono">
                     KEY: <span className="text-[#F5F5F5] font-bold tracking-widest">{lesson.access_key}</span>
                   </div>
                   <div className="flex items-center gap-4">
                     <form target="_blank" action="https://texlive.net/cgi-bin/latexcgi" method="POST" encType="multipart/form-data" className="inline-block">
                       <textarea name="filecontents[]" value={lesson.generated_plan} className="hidden" readOnly />
                       <input type="hidden" name="filename[]" value="document.tex" />
                       <input type="hidden" name="engine" value="pdflatex" />
                       <input type="hidden" name="return" value="pdf" />
                       <button type="submit" onClick={(e) => e.stopPropagation()} className="text-xs text-[#FFD54F] hover:text-[#FFCA28] font-bold uppercase tracking-wider">
                         View PDF
                       </button>
                     </form>
                     <button onClick={(e) => handleDeleteLesson(e, lesson.id)} className="text-[#666666] hover:text-red-400 transition-colors" title="Delete Lesson">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                </div>
              </div>
            ))}
            
            {lessons.length === 0 && (
              <div className="col-span-full py-16 text-center text-[#BDBDBD] border-2 border-dashed border-[#333333] rounded-xl flex flex-col items-center gap-3">
                 <BookOpen className="w-8 h-8 text-[#666666]" />
                 <div>
                   <p className="font-bold">No lessons created yet.</p>
                   <p className="text-xs mt-1 font-mono">Click "New Lesson Plan" to initialize your first curriculum.</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
