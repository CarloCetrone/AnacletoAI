import React from 'react';
import { Shield, Cpu, ArrowRight, CheckCircle2, Zap, Code2, Bot, Layers, FlaskConical } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: string) => void;
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

        {/* FULL SUITE PLATFORM PRESENTATION */}
        <div className="my-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight uppercase">
              A Complete AI Ecosystem for the Enterprise
            </h2>
            <p className="text-[#BDBDBD] text-sm sm:text-base mt-3">
              From breakthrough research papers to scalable production APIs and domain-specific model tuning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* 1. Frontier Research */}
            <div className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Frontier AI Research</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Advancing fundamental LLM architectures, reasoning capabilities, multimodal alignment, and efficient transformer training algorithms.
              </p>
            </div>

            {/* 2. Enterprise API & Chat */}
            <div className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Standard LLM Usage & APIs</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Access our proprietary base and instruction models via OpenAI-compatible REST APIs, SDKs, or ready-to-use web chat interfaces.
              </p>
            </div>

            {/* 3. Autonomous Agents */}
            <div className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Autonomous AI Agents</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Deploy multi-agent workflows capable of complex planning, tool execution, code generation, and automated data processing.
              </p>
            </div>

            {/* 4. Fine-Tuning & Custom Models */}
            <div className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Custom Model Fine-Tuning</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Adapt foundation open models (7B to 120B+) trained exclusively on your internal legal, financial, or technical domain data.
              </p>
            </div>

            {/* 5. Air-Gapped Sovereignty */}
            <div className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">100% Data Sovereignty</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Deploy models on your private cloud or on-premise hardware with zero data telemetry, meeting strict EU AI Act & GDPR standards.
              </p>
            </div>

            {/* 6. Ultra-Fast Inference */}
            <div className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Sub-50ms Inference Engine</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Custom KV-cache and speculative decoding kernels engineered for lightning-fast token generation at scale.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
