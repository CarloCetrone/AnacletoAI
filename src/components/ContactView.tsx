import React, { useState } from 'react';
import { Mail, Building2, User, Send, CheckCircle, FlaskConical, Code2 } from 'lucide-react';

export const ContactView: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    workEmail: '',
    projectDetails: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Column - Enterprise Info */}
        <div className="space-y-8 pt-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFD54F]/10 border border-[#FFD54F]/30 text-[#FFD54F] text-xs font-semibold uppercase tracking-wider mb-4">
              Research & Enterprise Scoping
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F5F5F5] tracking-tight leading-tight uppercase">
              Partner with our <br />
              <span className="text-[#FFD54F]">
                AI research engineers.
              </span>
            </h1>
          </div>

          <p className="text-[#BDBDBD] text-base sm:text-lg leading-relaxed">
            Whether you need standard API access to our foundation models, custom agent pipelines, academic research collaboration, or private sovereign fine-tuning, our engineering team is here to help.
          </p>

          <div className="space-y-4 pt-4 border-t border-[#333333]">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#1A1A1A] border border-[#333333] text-[#FFD54F] mt-1">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[#F5F5F5] font-semibold text-sm">Enterprise API & Agent Infrastructure</h4>
                <p className="text-[#BDBDBD] text-xs sm:text-sm mt-0.5">High-throughput streaming endpoints, tool-calling agents, and SDK support.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#1A1A1A] border border-[#333333] text-[#FFD54F] mt-1">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[#F5F5F5] font-semibold text-sm">AI Research & Custom Fine-Tuning</h4>
                <p className="text-[#BDBDBD] text-xs sm:text-sm mt-0.5">Joint foundation research, synthetic data generation, and air-gapped deployments.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Contact Form */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-[#FFD54F]/20 text-[#FFD54F] rounded-full flex items-center justify-center mx-auto border border-[#FFD54F]/40">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[#F5F5F5] uppercase">Inquiry Received</h3>
              <p className="text-[#BDBDBD] text-sm max-w-md mx-auto">
                Thank you for reaching out to Anacleto AI. One of our research engineers will contact you within 24 hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ fullName: '', company: '', workEmail: '', projectDetails: '' });
                }}
                className="mt-6 text-sm text-[#FFD54F] hover:underline font-medium"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-2">
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

              <div>
                <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-2">
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
                <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-2">
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

              <div>
                <label className="block text-xs font-semibold text-[#BDBDBD] uppercase tracking-wider mb-2">
                  Project / Research Scope
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.projectDetails}
                  onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })}
                  placeholder="Describe your use case: foundation research, API scaling, agent orchestration, or private fine-tuning..."
                  className="w-full px-4 py-3 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-sm focus:outline-none focus:border-[#FFD54F] focus:ring-1 focus:ring-[#FFD54F] transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] text-[#000000] font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#FFD54F]/20 flex items-center justify-center gap-2 group"
              >
                Send Request
                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
