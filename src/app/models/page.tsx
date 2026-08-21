import React from 'react';
import { Zap, Cpu, Sparkles, ArrowRight, Server, Database, Lock } from 'lucide-react';
import Link from 'next/link';

export default function ModelsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#FFD54F]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F5F5F5] uppercase mb-6">
            Our <span className="text-[#FFD54F]">Models</span>
          </h1>
          <p className="text-lg text-[#BDBDBD] leading-relaxed">
            State-of-the-art sovereign foundation models engineered for uncompromising performance, rigorous compliance, and deployment on your own infrastructure.
          </p>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
          
          {/* Anacleto Small */}
          <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-md bg-[#333333] text-[#F5F5F5] text-xs font-mono font-bold">7B PARAMS</span>
              </div>
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">Anacleto Small</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed mb-8">
                Ultra-fast, lightweight foundation model optimized for edge computing and rapid text classification. Perfect for low-latency environments.
              </p>
            </div>
            <div className="space-y-3 pt-6 border-t border-[#333333] text-sm">
              <div className="flex justify-between items-center"><span className="text-[#BDBDBD]">Context</span> <span className="text-[#F5F5F5] font-mono">32K Tokens</span></div>
              <div className="flex justify-between items-center"><span className="text-[#BDBDBD]">Latency</span> <span className="text-[#F5F5F5] font-mono">~20ms/token</span></div>
              <div className="flex justify-between items-center"><span className="text-[#BDBDBD]">VRAM Req</span> <span className="text-[#F5F5F5] font-mono">8GB</span></div>
            </div>
          </div>

          {/* Anacleto Medium */}
          <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#FFD54F] shadow-2xl shadow-[#FFD54F]/10 transition-all duration-300 flex flex-col justify-between group relative transform lg:-translate-y-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FFD54F] text-black font-bold text-xs uppercase tracking-wider">
              Flagship Standard
            </div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/20 border border-[#FFD54F]/40 flex items-center justify-center text-[#FFD54F] group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-md bg-[#FFD54F]/20 text-[#FFD54F] text-xs font-mono font-bold">30B PARAMS</span>
              </div>
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">Anacleto Medium</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed mb-8">
                The perfect balance of reasoning capability and speed. Designed for complex analysis, code generation, and enterprise RAG deployments.
              </p>
            </div>
            <div className="space-y-3 pt-6 border-t border-[#333333] text-sm">
              <div className="flex justify-between items-center"><span className="text-[#BDBDBD]">Context</span> <span className="text-[#F5F5F5] font-mono">128K Tokens</span></div>
              <div className="flex justify-between items-center"><span className="text-[#BDBDBD]">Latency</span> <span className="text-[#F5F5F5] font-mono">~45ms/token</span></div>
              <div className="flex justify-between items-center"><span className="text-[#BDBDBD]">VRAM Req</span> <span className="text-[#F5F5F5] font-mono">24GB (FP8)</span></div>
            </div>
          </div>

          {/* Anacleto Large */}
          <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-md bg-[#333333] text-[#F5F5F5] text-xs font-mono font-bold">120B+ PARAMS</span>
              </div>
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">Anacleto Large</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed mb-8">
                Our most powerful frontier model. Unmatched logic, legal analysis, and scientific discovery capabilities for mission-critical tasks.
              </p>
            </div>
            <div className="space-y-3 pt-6 border-t border-[#333333] text-sm">
              <div className="flex justify-between items-center"><span className="text-[#BDBDBD]">Context</span> <span className="text-[#F5F5F5] font-mono">128K Tokens</span></div>
              <div className="flex justify-between items-center"><span className="text-[#BDBDBD]">Latency</span> <span className="text-[#F5F5F5] font-mono">~80ms/token</span></div>
              <div className="flex justify-between items-center"><span className="text-[#BDBDBD]">VRAM Req</span> <span className="text-[#F5F5F5] font-mono">2x 80GB</span></div>
            </div>
          </div>

        </div>

        {/* Deployment Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 border-t border-[#333333] pt-16">
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center text-[#F5F5F5]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#F5F5F5] mb-1">On-Premise Deployment</h4>
              <p className="text-xs text-[#BDBDBD] leading-relaxed">Run entirely on your bare-metal servers. Zero telemetry or internet connection required.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center text-[#F5F5F5]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#F5F5F5] mb-1">Absolute Privacy</h4>
              <p className="text-xs text-[#BDBDBD] leading-relaxed">Fully GDPR and EU AI Act compliant. Your data never leaves your secure environment.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center text-[#F5F5F5]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#F5F5F5] mb-1">Custom Weights</h4>
              <p className="text-xs text-[#BDBDBD] leading-relaxed">Fine-tune base models on your proprietary datasets to create highly specialized agents.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/chat" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FFD54F] text-black font-bold uppercase tracking-wider hover:bg-[#FFCA28] transition-colors">
            Test Models in Secure Chat
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
