import React from 'react';
import { Building2, Sparkles, FlaskConical, Layers, Server, Bot, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EnterpriseSolutionsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#FFD54F]/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1A] border border-[#FFD54F]/30 text-[#FFD54F] text-sm font-semibold mb-6">
            <Building2 className="w-4 h-4" />
            <span>Absolute Data Sovereignty</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F5F5F5] mb-6 uppercase">
            Enterprise <span className="text-[#FFD54F]">Solutions</span>
          </h1>
          <p className="text-lg text-[#BDBDBD] leading-relaxed max-w-3xl mx-auto">
            Specialized B2B services engineered for highly regulated sectors (Banking, Healthcare, Defense) requiring absolute data sovereignty, air-gapped deployments, and rigorous EU AI Act compliance.
          </p>
        </div>

        {/* Enterprise Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          
          {/* 1. API */}
          <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Dedicated API Access</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed">
              Dedicated private API throughput, SLA-backed compute clusters, and sovereign access to Anacleto Small, Medium, and Large foundation models without rate limits.
            </p>
          </div>

          {/* 2. Fine Tuning */}
          <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <FlaskConical className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Model Distillation</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed">
              Custom fine-tuning on your private domain datasets with dedicated weight hosting. Distill large 120B reasoning capabilities into high-speed 7B edge models.
            </p>
          </div>

          {/* 3. RAG */}
          <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Sovereign RAG</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed">
              Connect enterprise data silos securely. Fully managed, air-gapped vector databases for "ChatGPT over internal data" with strict role-based access control and zero hallucination.
            </p>
          </div>

          {/* 4. Appliance */}
          <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#FFD54F]/50 shadow-lg shadow-[#FFD54F]/5 transition-colors group relative">
            <div className="absolute top-4 right-4 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD54F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FFD54F]"></span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/20 border border-[#FFD54F]/40 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">The "AI Appliance"</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed">
              Pre-loaded physical rack servers deployed directly on-premise inside your intranet. Zero outbound internet connections. The ultimate security for Defense and Banking.
            </p>
          </div>

          {/* 5. Agents */}
          <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Vertical Agents</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed">
              Highly specific autonomous agents tailored for Legal Discovery & Redaction, Financial KYC/AML compliance, and Medical Data Analysis.
            </p>
          </div>

          {/* 6. Compliance */}
          <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Red Teaming</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed">
              Aggressive security auditing, adversarial prompt-injection attacks, and compliance readiness testing against the EU AI Act and GDPR frameworks.
            </p>
          </div>

        </div>

        {/* CTA */}
        <div className="text-center mt-12 bg-[#1A1A1A] border border-[#333333] rounded-3xl p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#F5F5F5] mb-4">Ready to secure your AI infrastructure?</h2>
          <p className="text-[#BDBDBD] mb-8">Our enterprise architects are available to design your sovereign deployment.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FFD54F] text-black font-bold uppercase tracking-wider hover:bg-[#FFCA28] transition-colors shadow-lg shadow-[#FFD54F]/20">
            Contact Enterprise Sales
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
