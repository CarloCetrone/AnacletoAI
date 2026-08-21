import React from 'react';
import { Terminal, Code2, Bot, ArrowRight, Server, Shield, Network } from 'lucide-react';
import Link from 'next/link';

export default function DeveloperSolutionsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#FFD54F]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1A] border border-[#FFD54F]/30 text-[#FFD54F] text-sm font-semibold mb-6">
            <Terminal className="w-4 h-4" />
            <span>Built by Developers, for Developers</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F5F5F5] mb-6 uppercase">
            Developer <span className="text-[#FFD54F]">Solutions</span>
          </h1>
          <p className="text-lg text-[#BDBDBD] leading-relaxed max-w-3xl mx-auto">
            High-throughput developer APIs and specialized autonomous AI agents built for code generation, system architecture, and general workflow automation.
          </p>
        </div>

        {/* 3 Main Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
          
          {/* APIs */}
          <div className="p-8 rounded-3xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-all duration-300 flex flex-col group">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Code2 className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">High-Throughput APIs</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed flex-1 mb-6">
              OpenAI-compatible REST and streaming chat endpoints. Easily swap base URLs to route queries to Anacleto models with zero code friction.
            </p>
            <div className="p-4 bg-[#121212] rounded-xl border border-[#333333] font-mono text-xs text-[#BDBDBD] overflow-x-auto">
              <div className="text-[#FFD54F] mb-1">POST /v1/chat/completions</div>
              <div>Authorization: Bearer {'<token>'}</div>
            </div>
          </div>

          {/* Anacleto Code */}
          <div className="p-8 rounded-3xl bg-[#1A1A1A] border border-[#FFD54F]/60 shadow-xl shadow-[#FFD54F]/5 transition-all duration-300 flex flex-col group relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FFD54F] text-black font-bold text-xs uppercase tracking-wider whitespace-nowrap">
              Most Popular
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#FFD54F]/20 border border-[#FFD54F]/40 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Terminal className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">Anacleto Code</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed flex-1 mb-6">
              Autonomous pair-programming agent capable of entire repository navigation, massive multi-file refactoring, bug fixing, and automated unit test execution.
            </p>
            <Link href="/contact" className="w-full py-3 rounded-lg border border-[#FFD54F] text-[#FFD54F] text-center font-bold text-sm hover:bg-[#FFD54F] hover:text-black transition-colors">
              Request IDE Access
            </Link>
          </div>

          {/* Anacleto Agent */}
          <div className="p-8 rounded-3xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-all duration-300 flex flex-col group">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">Anacleto Agent</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed flex-1 mb-6">
              General-purpose autonomous agent with multi-step tool execution, live web search, document parsing, and shell access for complex workflow automation.
            </p>
            <div className="p-4 bg-[#121212] rounded-xl border border-[#333333] font-mono text-xs text-[#BDBDBD]">
              <span className="text-green-400">➜</span> anacleto run "analyze db logs"
            </div>
          </div>

        </div>

        {/* Feature List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 border-t border-[#333333]">
          <div className="flex gap-4">
            <div className="shrink-0 text-[#FFD54F]"><Server className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-[#F5F5F5] mb-2">99.99% Uptime SLA</h4>
              <p className="text-sm text-[#BDBDBD]">Enterprise-grade reliability for your production applications.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 text-[#FFD54F]"><Shield className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-[#F5F5F5] mb-2">SOC2 Type II</h4>
              <p className="text-sm text-[#BDBDBD]">Rigorous security compliance for handling sensitive developer data.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="shrink-0 text-[#FFD54F]"><Network className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-[#F5F5F5] mb-2">Global Edge Network</h4>
              <p className="text-sm text-[#BDBDBD]">Ultra-low latency inference nodes distributed globally.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link href="/api-docs" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FFD54F] text-black font-bold uppercase tracking-wider hover:bg-[#FFCA28] transition-colors shadow-lg shadow-[#FFD54F]/20">
            View API Documentation
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
