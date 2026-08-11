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
  Play
} from 'lucide-react';

interface ServiceDetailViewProps {
  serviceId: string;
  onNavigate: (view: string, id?: string) => void;
}

export const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({ serviceId, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderServiceContent = () => {
    switch (serviceId) {
      case 'rag':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-4">Vector Database Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Indexed Documents</p>
                  <p className="text-xl font-mono text-[#F5F5F5]">14,230</p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Index Size</p>
                  <p className="text-xl font-mono text-[#F5F5F5]">1.4 GB</p>
                </div>
              </div>
              <button className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#252525] hover:bg-[#333333] border border-[#333333] text-[#F5F5F5] text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#FFD54F]" />
                Upload New Data Pipeline
              </button>
            </div>
          </div>
        );
      case 'compliance':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-4">EU AI Act Readiness Tracker</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-emerald-900/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-[#F5F5F5] text-sm font-semibold">Data Sovereignty Audit</p>
                      <p className="text-[#BDBDBD] text-xs">Passed - Frankfurt Datacenter Verified</p>
                    </div>
                  </div>
                  <button className="text-xs text-emerald-400 underline">View Report</button>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-amber-900/50">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-[#F5F5F5] text-sm font-semibold">Risk Classification</p>
                      <p className="text-[#BDBDBD] text-xs">Pending - Questionnaire required</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-amber-400/10 text-amber-400 rounded text-xs font-semibold">Complete</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'agents':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-4">Active Vertical Agents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525] hover:border-[#FFD54F]/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-[#FFD54F]" />
                    <span className="text-sm font-bold text-[#F5F5F5]">Legal Redaction Agent</span>
                  </div>
                  <p className="text-xs text-[#666666] mb-4">Processes legal discovery docs for PII.</p>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Deployed
                  </div>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525] flex flex-col items-center justify-center border-dashed text-[#666666] hover:text-[#F5F5F5] hover:border-[#F5F5F5] transition-colors cursor-pointer">
                   <div className="text-2xl mb-1">+</div>
                   <span className="text-xs font-semibold">Deploy New Agent</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'appliance':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-4">Hardware Telemetry (Frankfurt Node)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">GPU Utilization</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-mono text-[#F5F5F5]">84%</p>
                    <div className="w-full h-1.5 bg-[#252525] rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-[#FFD54F] w-[84%]"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">VRAM Usage</p>
                  <p className="text-xl font-mono text-[#F5F5F5]">112 / 160 GB</p>
                </div>
                 <div className="bg-[#121212] p-4 rounded-lg border border-[#252525]">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Node Temp</p>
                  <p className="text-xl font-mono text-emerald-400">62°C</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'distillation':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-[#F5F5F5] font-bold text-lg">Edge Model Training Jobs</h3>
                 <button className="px-3 py-1.5 bg-[#FFD54F] text-black text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1 hover:bg-[#FFCA28]">
                   <Play className="w-3 h-3" /> New Job
                 </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-[#BDBDBD]">
                  <thead className="bg-[#121212] text-[#FFD54F] font-mono uppercase text-[11px] border-b border-[#333333]">
                    <tr>
                      <th className="p-3">Model Name</th>
                      <th className="p-3">Base Model</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252525]">
                    <tr>
                      <td className="p-3 font-semibold text-white">Legal-Edge-7B-v2</td>
                      <td className="p-3 font-mono">Anacleto-7B</td>
                      <td className="p-3 text-emerald-400">Completed</td>
                      <td className="p-3 font-mono">0.842</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Finance-Audit-3B</td>
                      <td className="p-3 font-mono">Anacleto-3B</td>
                      <td className="p-3 text-amber-400 animate-pulse">Training (42%)</td>
                      <td className="p-3 font-mono">1.104</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'red-teaming':
        return (
           <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-bold text-lg mb-4">Adversarial Attack Simulator</h3>
              <p className="text-xs text-[#BDBDBD] mb-6 leading-relaxed">
                Configure a multi-agent adversarial simulation to test your internal models for data leakage, prompt injection, and bias.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#666666] mb-1">Target Endpoint URL</label>
                  <input type="text" placeholder="https://internal-api.company.com/v1/chat" className="w-full bg-[#121212] border border-[#333333] rounded p-2.5 text-sm text-[#F5F5F5] focus:border-[#FFD54F] focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#666666] mb-1">Attack Vector Profile</label>
                  <select className="w-full bg-[#121212] border border-[#333333] rounded p-2.5 text-sm text-[#F5F5F5] focus:border-[#FFD54F] focus:outline-none">
                    <option>Data Exfiltration (PII/Financials)</option>
                    <option>System Prompt Extraction</option>
                    <option>Jailbreak / Refusal Bypass</option>
                  </select>
                </div>
                <button className="w-full mt-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-bold uppercase text-xs tracking-wider rounded-lg transition-colors">
                  Launch Red Team Attack
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <div className="text-[#BDBDBD] p-8 text-center">Service details not found.</div>;
    }
  };

  const getServiceInfo = () => {
    switch (serviceId) {
      case 'rag': return { title: 'Sovereign RAG', icon: Layers };
      case 'compliance': return { title: 'Compliance Audits', icon: Shield };
      case 'agents': return { title: 'Vertical Agents', icon: Bot };
      case 'appliance': return { title: 'AI Appliance', icon: Cpu };
      case 'distillation': return { title: 'Model Distillation', icon: FlaskConical };
      case 'red-teaming': return { title: 'Red Teaming', icon: Zap };
      default: return { title: 'Service', icon: Layers };
    }
  };

  const info = getServiceInfo();
  const Icon = info.icon;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      <button 
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#FFD54F] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#333333]">
        <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/30 flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#FFD54F]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] uppercase tracking-tight">{info.title}</h1>
          <p className="text-[#BDBDBD] text-sm">Enterprise Service Console</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-[#333333]">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'overview' ? 'text-[#FFD54F] border-[#FFD54F]' : 'text-[#666666] border-transparent hover:text-[#BDBDBD]'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'settings' ? 'text-[#FFD54F] border-[#FFD54F]' : 'text-[#666666] border-transparent hover:text-[#BDBDBD]'}`}
        >
          Settings
        </button>
      </div>

      {activeTab === 'overview' ? renderServiceContent() : (
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 text-center text-[#BDBDBD] text-sm">
          Settings configuration for {info.title} is currently disabled in the sandbox environment.
        </div>
      )}
    </div>
  );
};
