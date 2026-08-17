import React, { useState } from 'react';
import { Mail, Building2, User, Send, CheckCircle, FlaskConical, Code2, Loader2, AlertCircle, Shield, Cpu, Bot, Sparkles, Server } from 'lucide-react';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxetkV6yhb38N77gpku0-9t8ay9Vwz4mm4LDyvOmNvhB-2FWuzRk9QreHtLttfilzRUrQ/exec';

export const ContactView: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    workEmail: '',
    projectDetails: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const queryParams = new URLSearchParams({
        fullName: formData.fullName,
        company: formData.company,
        workEmail: formData.workEmail,
        projectDetails: formData.projectDetails
      }).toString();

      await fetch(`${SCRIPT_URL}?${queryParams}`, {
        method: 'GET',
        mode: 'no-cors'
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting form:', err);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative pt-24 pb-20 overflow-hidden">
      {/* Background Gold Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-[#FFD54F]/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* CENTERED SYMMETRICAL HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1A] border border-[#FFD54F]/40 text-[#FFD54F] text-xs font-semibold shadow-lg shadow-[#FFD54F]/5">
            <FlaskConical className="w-4 h-4 text-[#FFD54F] animate-pulse" />
            <span>Research & Enterprise Scoping</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#F5F5F5] tracking-tight leading-tight uppercase">
            Partner with our <br />
            <span className="text-[#FFD54F]">
              AI Research Engineers.
            </span>
          </h1>

          <p className="text-[#BDBDBD] text-base sm:text-lg leading-relaxed font-normal max-w-2xl mx-auto">
            Whether you need enterprise access to Anacleto models, custom fine-tuning, autonomous agent orchestration, or on-premise hardware deployment, our engineering team is ready to scope your project.
          </p>
        </div>

        {/* BALANCED SYMMETRICAL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* Left Column: Scope Highlights (5 cols) */}
          <div className="lg:col-span-5 bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
            <div>
              <h3 className="text-xl font-bold text-[#F5F5F5] uppercase tracking-wider mb-2">Enterprise Capabilities</h3>
              <p className="text-xs text-[#BDBDBD] mb-6">Our research engineers support end-to-end integration across sovereign environments.</p>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#121212] border border-[#333333] flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#333333] text-[#FFD54F] shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[#F5F5F5] font-bold text-xs uppercase tracking-wider">Enterprise Model Access</h4>
                    <p className="text-[#BDBDBD] text-xs mt-1 leading-relaxed">Dedicated private API throughput and SLA-backed clusters for Anacleto models.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#121212] border border-[#333333] flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#333333] text-[#FFD54F] shrink-0">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[#F5F5F5] font-bold text-xs uppercase tracking-wider">Fine-Tuning & Distillation</h4>
                    <p className="text-[#BDBDBD] text-xs mt-1 leading-relaxed">Private weight hosting on custom domain datasets and 3B/7B edge distillation.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#121212] border border-[#333333] flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#333333] text-[#FFD54F] shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[#F5F5F5] font-bold text-xs uppercase tracking-wider">Sovereign RAG & Appliance</h4>
                    <p className="text-[#BDBDBD] text-xs mt-1 leading-relaxed">Air-gapped vector search over internal data and on-premise hardware deployments.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#333333] text-center">
              <span className="text-[11px] font-mono text-[#FFD54F] uppercase tracking-widest font-semibold">
                Fast Response • 24h Engineering Turnaround
              </span>
            </div>
          </div>

          {/* Right Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
            {submitted ? (
              <div className="py-16 text-center space-y-4 my-auto">
                <div className="w-16 h-16 bg-[#FFD54F]/20 text-[#FFD54F] rounded-full flex items-center justify-center mx-auto border border-[#FFD54F]/40">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#F5F5F5] uppercase">Inquiry Received</h3>
                <p className="text-[#BDBDBD] text-sm max-w-md mx-auto">
                  Thank you for reaching out to Anacleto AI. One of our research engineers will contact you within 24 hours at <strong className="text-[#FFD54F]">{formData.workEmail}</strong>.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ fullName: '', company: '', workEmail: '', projectDetails: '' });
                  }}
                  className="mt-6 text-sm text-[#FFD54F] hover:underline font-bold uppercase tracking-wider"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="border-b border-[#333333] pb-4 mb-4">
                    <h3 className="text-xl font-bold text-[#F5F5F5] uppercase tracking-wider">Contact Us</h3>
                    <p className="text-xs text-[#BDBDBD] mt-1">Fill out the form below and our engineering team will get back to you.</p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 mb-4">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#666666] absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Dr. Alex Vance"
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-1.5">
                          Company / Institution
                        </label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-[#666666] absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            required
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="DeepTech Research Corp"
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-1.5">
                          Work Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-3.5" />
                          <input
                            type="email"
                            required
                            value={formData.workEmail}
                            onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                            placeholder="alex@deeptech.com"
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-1.5">
                        Project / Research Scope
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={formData.projectDetails}
                        onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })}
                        placeholder="Describe your use case: Anacleto model access, API scaling, fine-tuning, or private appliance..."
                        className="w-full px-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] disabled:opacity-50 text-[#000000] font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#FFD54F]/20 flex items-center justify-center gap-2 group mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Request
                      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
