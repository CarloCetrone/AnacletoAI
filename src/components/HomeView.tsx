import React from 'react';
import { Shield, Cpu, ArrowRight, CheckCircle2, Zap, Code2, Bot, Layers, FlaskConical, Building, Award, Check } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="relative pt-24 pb-16 overflow-hidden">
      {/* Background Gold Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-[#FFD54F]/10 blur-[140px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HERO SECTION */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto pt-8 pb-16">
          
          {/* Research & Tech Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1A] border border-[#FFD54F]/40 text-[#FFD54F] text-xs sm:text-sm font-semibold mb-8 shadow-lg shadow-[#FFD54F]/5 cursor-default">
            <FlaskConical className="w-4 h-4 text-[#FFD54F] animate-pulse" />
            <span>AI Research Lab & Enterprise Intelligence</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#F5F5F5] leading-[1.15] mb-6 uppercase">
            Pioneering Next-Gen{" "}
            <span className="text-[#FFD54F]">
              Sovereign LLMs
            </span>{" "}
            & AI Intelligence.
          </h1>

          {/* Sub-headline */}
          <p className="text-lg sm:text-xl text-[#BDBDBD] max-w-3xl font-normal leading-relaxed mb-10">
            Anacleto AI conducts core artificial intelligence research and builds state-of-the-art foundation models. We power enterprise intelligence via direct API endpoints, autonomous AI agents, interactive chat, and custom sovereign fine-tuning.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('contact')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] text-[#000000] font-bold text-base uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#FFD54F]/20 flex items-center justify-center gap-2 group"
            >
              Request Enterprise Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('chat')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-[#FFD54F] bg-transparent text-[#FFD54F] hover:bg-[#FFD54F] hover:text-[#000000] font-bold text-base uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Bot className="w-5 h-5" />
              Try Anacleto Chat
            </button>
          </div>

          {/* Key Capabilities Pills */}
          <div className="mt-12 pt-8 border-t border-[#333333] grid grid-cols-2 md:grid-cols-4 gap-6 w-full text-[#BDBDBD] text-xs sm:text-sm font-medium">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FFD54F]" />
              <span>Foundation LLM Research</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FFD54F]" />
              <span>High-Throughput API Endpoints</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FFD54F]" />
              <span>Autonomous AI Agent Mesh</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FFD54F]" />
              <span>Sovereign Private Deployment</span>
            </div>
          </div>
        </div>

        {/* ENTERPRISE MARQUEE */}
        <div className="py-8 border-y border-[#333333] my-8 overflow-hidden bg-[#121212]/50">
          <p className="text-center text-xs font-mono uppercase tracking-widest text-[#666666] mb-6">
            Engineered for High-Security Enterprise & EU Research Institutions
          </p>
          <div className="flex justify-center flex-wrap gap-8 sm:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500 text-xs font-mono text-[#BDBDBD]">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#FFD54F]" />
              <span>FINANCIAL SERVICES</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FFD54F]" />
              <span>LEGAL TECH LABS</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FFD54F]" />
              <span>DEFENSE & HEALTHCARE</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#FFD54F]" />
              <span>SOVEREIGN CLOUD INFRA</span>
            </div>
          </div>
        </div>

        {/* ENTERPRISE B2B SERVICES */}
        <div className="my-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight uppercase">
              Enterprise AI Solutions
            </h2>
            <p className="text-[#BDBDBD] text-sm sm:text-base mt-3">
              Specialized B2B services engineered for highly regulated sectors requiring absolute data sovereignty and compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* 1. Sovereign RAG */}
            <div 
              onClick={() => onNavigate('service-detail', 'rag')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Sovereign RAG-as-a-Service</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Connect enterprise data silos securely. Fully managed, air-gapped vector databases for "ChatGPT over internal data" with zero hallucination.
              </p>
            </div>

            {/* 2. Compliance Audits */}
            <div 
              onClick={() => onNavigate('service-detail', 'compliance')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">AI Compliance & Readiness</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Consulting and auditing services to transition enterprise AI usage into full compliance with the EU AI Act and GDPR frameworks.
              </p>
            </div>

            {/* 3. Vertical Agents */}
            <div 
              onClick={() => onNavigate('service-detail', 'agents')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Vertical Autonomous Agents</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Highly specific agents for Legal Discovery & Redaction, Financial KYC/AML, and Medical Data Analysis—all fully air-gapped.
              </p>
            </div>

            {/* 4. AI Appliance */}
            <div 
              onClick={() => onNavigate('service-detail', 'appliance')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">The "AI Appliance"</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Pre-loaded physical rack servers deployed on-premise inside your intranet. Zero outbound connections, ultimate security.
              </p>
            </div>

            {/* 5. Distillation */}
            <div 
              onClick={() => onNavigate('service-detail', 'distillation')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Model Distillation & Edge AI</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                We distill our 120B models into highly specialized 3B/7B models customized for your tasks, runnable on employee laptops or POS systems.
              </p>
            </div>

            {/* 6. Red Teaming */}
            <div 
              onClick={() => onNavigate('service-detail', 'red-teaming')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Sovereign Red Teaming</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Aggressive security auditing and adversarial attacks against your internal AI pipelines to ensure robust data leakage protection.
              </p>
            </div>

          </div>
        </div>

        {/* COMPARATIVE SOVEREIGN MATRIX */}
        <div className="my-16 bg-[#1A1A1A] border border-[#333333] rounded-2xl p-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-xl font-bold text-[#F5F5F5] uppercase">Anacleto Sovereign AI vs Public Cloud APIs</h3>
            <p className="text-xs text-[#BDBDBD] mt-1">Comparing enterprise data safety, compliance, and inference independence.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-[#BDBDBD]">
              <thead className="bg-[#121212] text-[#FFD54F] font-mono uppercase text-[11px] border-b border-[#333333]">
                <tr>
                  <th className="p-4">Feature</th>
                  <th className="p-4">Anacleto Sovereign AI</th>
                  <th className="p-4">Public Cloud APIs (US Providers)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252525]">
                <tr>
                  <td className="p-4 font-semibold text-white">Data Residency</td>
                  <td className="p-4 text-emerald-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> 100% On-Prem / EU Frankfurt</td>
                  <td className="p-4 text-red-400">US Jurisdiction / Global Multi-region</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">EU AI Act Readiness</td>
                  <td className="p-4 text-emerald-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> Native Compliance Ready</td>
                  <td className="p-4 text-amber-400">Requires Third-Party Compliance Wrapping</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Zero Telemetry / Logging</td>
                  <td className="p-4 text-emerald-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> Guaranteed Air-Gapped Isolation</td>
                  <td className="p-4 text-red-400">Subject to Cloud Provider Logging Policy</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Custom Domain Fine-Tuning</td>
                  <td className="p-4 text-emerald-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> Dedicated Private GPU Weights</td>
                  <td className="p-4 text-amber-400">Shared Multi-Tenant Infrastructure</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
