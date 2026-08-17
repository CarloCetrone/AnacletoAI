import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Layers, 
  Shield, 
  Bot, 
  Cpu, 
  FlaskConical, 
  Zap,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Play,
  Code2,
  Terminal,
  Server,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ServiceDetailViewProps {
  serviceId: string;
  onNavigate: (view: string, id?: string) => void;
}

export const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({ serviceId, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderServiceContent = () => {
    switch (serviceId) {
      case 'api-docs':
      case 'api':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 space-y-4">
              <h3 className="text-[#F5F5F5] font-bold text-lg">High-Throughput Developer APIs</h3>
              <p className="text-sm text-[#BDBDBD] leading-relaxed">
                Anacleto provides OpenAI-compatible REST and SSE streaming chat completion endpoints. Easily route your inference workloads to Anacleto Small, Medium, or Large with zero refactoring.
              </p>
              
              <div className="bg-[#121212] p-4 rounded-lg border border-[#252525] font-mono text-xs text-[#FFD54F]">
                <code>POST https://api.anacletoai.com/v1/chat/completions</code>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Max Token Limit</p>
                  <p className="text-xl font-mono text-[#F5F5F5]">16,384 Tokens</p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">P99 Latency</p>
                  <p className="text-xl font-mono text-emerald-400">&lt; 14 ms</p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Protocol</p>
                  <p className="text-xl font-mono text-[#F5F5F5]">HTTP/2 & SSE</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#333333] flex flex-wrap gap-4">
                <button 
                  onClick={() => onNavigate('contact')}
                  className="px-5 py-2.5 rounded-lg bg-[#FFD54F] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#FFCA28] transition-all"
                >
                  Request API Key
                </button>
              </div>
            </div>
          </div>
        );

      case 'anacleto-code':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 space-y-4">
              <h3 className="text-[#F5F5F5] font-bold text-lg">Anacleto Code — Autonomous Pair Programmer</h3>
              <p className="text-sm text-[#BDBDBD] leading-relaxed">
                Anacleto Code is an autonomous coding agent designed for codebase-wide repository navigation, complex refactoring, feature implementation, and unit test generation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Supported Languages</p>
                  <p className="text-sm font-semibold text-[#F5F5F5]">TypeScript, Python, Rust, Go, C++</p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Integrations</p>
                  <p className="text-sm font-semibold text-[#F5F5F5]">VS Code Extension & CLI</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#333333] flex flex-wrap gap-4">
                <button 
                  onClick={() => onNavigate('chat')}
                  className="px-5 py-2.5 rounded-lg bg-[#FFD54F] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#FFCA28] transition-all flex items-center gap-2"
                >
                  Try Anacleto Code in Chat
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'anacleto-agent':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 space-y-4">
              <h3 className="text-[#F5F5F5] font-bold text-lg">Anacleto Agent — Workflow Automation</h3>
              <p className="text-sm text-[#BDBDBD] leading-relaxed">
                General-purpose autonomous agent with multi-step tool execution capabilities including live web search retrieval, document analysis, image generation, and data extraction.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Tool Executions</p>
                  <p className="text-sm font-semibold text-[#FFD54F]">Web Search, Flux 2.0, Trellis 3D</p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Reasoning Engine</p>
                  <p className="text-sm font-semibold text-[#F5F5F5]">Internal Thinking Step</p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Data Isolation</p>
                  <p className="text-sm font-semibold text-emerald-400">Zero Retention</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#333333] flex flex-wrap gap-4">
                <button 
                  onClick={() => onNavigate('chat')}
                  className="px-5 py-2.5 rounded-lg bg-[#FFD54F] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#FFCA28] transition-all flex items-center gap-2"
                >
                  Launch Anacleto Agent
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'enterprise-access':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 space-y-4">
              <h3 className="text-[#F5F5F5] font-bold text-lg">Enterprise Access to Anacleto Models</h3>
              <p className="text-sm text-[#BDBDBD] leading-relaxed">
                Dedicated private compute instances and SLA-backed throughput reserved exclusively for your organization across Anacleto Small, Medium, and Large models.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Guaranteed SLA</p>
                  <p className="text-xl font-mono text-[#F5F5F5]">99.99% Uptime</p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Deployment Location</p>
                  <p className="text-xl font-mono text-emerald-400">EU Frankfurt Datacenter</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#333333] flex flex-wrap gap-4">
                <button 
                  onClick={() => onNavigate('contact')}
                  className="px-5 py-2.5 rounded-lg bg-[#FFD54F] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#FFCA28] transition-all"
                >
                  Contact Enterprise Team
                </button>
              </div>
            </div>
          </div>
        );

      case 'rag':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-4">Sovereign RAG-as-a-Service</h3>
              <p className="text-sm text-[#BDBDBD] leading-relaxed mb-6">
                Connect enterprise data silos securely. Fully managed, air-gapped vector databases for "ChatGPT over internal data" with zero hallucination.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Air-Gapped Vector DB</p>
                  <p className="text-xl font-mono text-[#F5F5F5]">Private Indexing</p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Data Sovereignty</p>
                  <p className="text-xl font-mono text-emerald-400">100% GDPR Compliant</p>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('contact')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#FFD54F] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#FFCA28] transition-colors"
              >
                Schedule RAG Audit
              </button>
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-4">AI Compliance & Readiness</h3>
              <p className="text-sm text-[#BDBDBD] leading-relaxed mb-6">
                Consulting and auditing services to transition enterprise AI usage into full compliance with the EU AI Act and GDPR frameworks.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-emerald-900/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-[#F5F5F5] text-sm font-semibold">Data Sovereignty Audit</p>
                      <p className="text-[#BDBDBD] text-xs">Passed - Frankfurt Datacenter Verified</p>
                    </div>
                  </div>
                  <button onClick={() => onNavigate('contact')} className="text-xs text-[#FFD54F] font-bold uppercase">Contact</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'agents':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-4">Vertical Autonomous Agents</h3>
              <p className="text-sm text-[#BDBDBD] leading-relaxed mb-6">
                Highly specific agents for Legal Discovery & Redaction, Financial KYC/AML, and Medical Data Analysis—all fully air-gapped.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-[#FFD54F]" />
                    <span className="text-sm font-bold text-[#F5F5F5]">Legal Discovery & Redaction</span>
                  </div>
                  <p className="text-xs text-[#666666]">Automated document scanning & PII redaction.</p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-[#FFD54F]" />
                    <span className="text-sm font-bold text-[#F5F5F5]">Financial KYC/AML Pipeline</span>
                  </div>
                  <p className="text-xs text-[#666666]">Real-time anti-money laundering risk analysis.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appliance':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-4">The "AI Appliance" (On-Premise Hardware Rack)</h3>
              <p className="text-sm text-[#BDBDBD] leading-relaxed mb-6">
                Pre-loaded physical rack servers deployed on-premise inside your intranet. Zero outbound connections, ultimate data security.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">WAN Connection</p>
                  <p className="text-xl font-mono text-emerald-400">Zero Air-Gap</p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Rack Form Factor</p>
                  <p className="text-xl font-mono text-[#F5F5F5]">4U / 8U Chassis</p>
                </div>
                 <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Pre-Loaded Models</p>
                  <p className="text-xl font-mono text-[#FFD54F]">Anacleto Suite</p>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('contact')}
                className="px-5 py-2.5 rounded-lg bg-[#FFD54F] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#FFCA28] transition-colors"
              >
                Request Hardware Specs
              </button>
            </div>
          </div>
        );

      case 'distillation':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-4">Fine-Tuning & Model Distillation</h3>
              <p className="text-sm text-[#BDBDBD] leading-relaxed mb-6">
                We fine-tune Anacleto foundation models on your private domain datasets with full private weight hosting, and distill 120B intelligence down into highly specialized 3B/7B edge models.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Private Weight Ownership</p>
                  <p className="text-base font-semibold text-[#F5F5F5]">100% Client Owned</p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Edge Target Runtime</p>
                  <p className="text-base font-semibold text-[#FFD54F]">Laptops, POS, On-Prem</p>
                </div>
              </div>

              <button 
                onClick={() => onNavigate('contact')}
                className="px-5 py-2.5 rounded-lg bg-[#FFD54F] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#FFCA28] transition-colors"
              >
                Scope Fine-Tuning Job
              </button>
            </div>
          </div>
        );

      case 'red-teaming':
        return (
           <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-4">Sovereign Red Teaming & Compliance</h3>
              <p className="text-sm text-[#BDBDBD] leading-relaxed mb-6">
                Aggressive security auditing, adversarial attacks, and compliance readiness testing against your internal AI pipelines under the EU AI Act and GDPR.
              </p>

              <button 
                onClick={() => onNavigate('contact')}
                className="px-5 py-2.5 rounded-lg bg-[#FFD54F] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#FFCA28] transition-colors"
              >
                Schedule Security Audit
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8 text-center space-y-4">
            <h3 className="text-xl font-bold text-[#F5F5F5] uppercase">Solution Overview</h3>
            <p className="text-sm text-[#BDBDBD]">Explore custom enterprise AI deployments, fine-tuning, and sovereign architecture with Anacleto AI.</p>
            <button 
              onClick={() => onNavigate('contact')}
              className="px-5 py-2.5 rounded-lg bg-[#FFD54F] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#FFCA28] transition-all"
            >
              Contact Us for Specs
            </button>
          </div>
        );
    }
  };

  const getServiceInfo = () => {
    switch (serviceId) {
      case 'api-docs':
      case 'api': return { title: 'High-Throughput APIs', icon: Code2 };
      case 'anacleto-code': return { title: 'Anacleto Code', icon: Terminal };
      case 'anacleto-agent': return { title: 'Anacleto Agent', icon: Bot };
      case 'enterprise-access': return { title: 'Enterprise Access', icon: Sparkles };
      case 'rag': return { title: 'Sovereign RAG', icon: Layers };
      case 'compliance': return { title: 'Compliance Audits', icon: Shield };
      case 'agents': return { title: 'Vertical Agents', icon: Bot };
      case 'appliance': return { title: 'AI Appliance', icon: Server };
      case 'distillation': return { title: 'Fine-Tuning & Distillation', icon: FlaskConical };
      case 'red-teaming': return { title: 'Red Teaming & Compliance', icon: Zap };
      default: return { title: 'Enterprise Solution Detail', icon: Layers };
    }
  };

  const info = getServiceInfo();
  const Icon = info.icon;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      <button 
        onClick={() => onNavigate('home')}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#BDBDBD] hover:text-[#FFD54F] transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#333333]">
        <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/30 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-[#FFD54F]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] uppercase tracking-tight">{info.title}</h1>
          <p className="text-[#BDBDBD] text-xs sm:text-sm">Anacleto Sovereign AI Solutions & Infrastructure</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-[#333333]">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'overview' ? 'text-[#FFD54F] border-[#FFD54F]' : 'text-[#666666] border-transparent hover:text-[#BDBDBD]'}`}
        >
          Overview
        </button>
      </div>

      {renderServiceContent()}
    </div>
  );
};
