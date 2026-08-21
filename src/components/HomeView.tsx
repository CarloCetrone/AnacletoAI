import React from 'react';
import { 
  Shield, 
  Cpu, 
  ArrowRight, 
  Zap, 
  Code2, 
  Bot, 
  Layers, 
  FlaskConical, 
  Terminal, 
  Server, 
  Sparkles,
  Image as ImageIcon,
  Video,
  Box,
  Music,
  GraduationCap,
  BookOpen,
  PenTool
} from 'lucide-react';

import { useRouter } from 'next/navigation';

export const HomeView: React.FC = () => {
  const router = useRouter();
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
              onClick={() => router.push('/contact')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] text-[#000000] font-bold text-base uppercase tracking-wider transition-all duration-200 shadow-lg shadow-[#FFD54F]/20 flex items-center justify-center gap-2 group"
            >
              Contact Us
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => router.push('/chat')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-[#FFD54F] bg-transparent text-[#FFD54F] hover:bg-[#FFD54F] hover:text-[#000000] font-bold text-base uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Bot className="w-5 h-5" />
              Try Our Models
            </button>
          </div>
        </div>

        {/* 1. FOUNDATION MODELS (SMALL, MEDIUM, LARGE) */}
        <div id="models" className="my-16 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight uppercase">
              Anacleto Foundation Models
            </h2>
            <p className="text-[#BDBDBD] text-sm sm:text-base mt-3">
              Standard foundation models built for high-speed edge workloads, deep reasoning, and sovereign enterprise scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Anacleto Small */}
            <div 
              onClick={() => router.push('/chat')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-md bg-[#FFD54F]/10 border border-[#FFD54F]/30 text-[#FFD54F] text-xs font-mono font-bold">7B PARAMETERS</span>
                </div>
                <h3 className="text-2xl font-bold text-[#F5F5F5] mb-2">Anacleto Small</h3>
                <p className="text-[#BDBDBD] text-sm leading-relaxed mb-6">
                  Lightweight, high-speed foundation model optimized for edge computing, local devices, rapid classification, and minimal latency.
                </p>
              </div>
              <div className="space-y-2 pt-4 border-t border-[#333333] text-xs text-[#BDBDBD] font-mono">
                <div className="flex justify-between"><span>Context Window:</span> <span className="text-[#F5F5F5]">32,768 tokens</span></div>
                <div className="flex justify-between"><span>Primary Use:</span> <span className="text-[#F5F5F5]">Edge & High-Speed Queries</span></div>
              </div>
            </div>

            {/* Anacleto Medium */}
            <div 
              onClick={() => router.push('/chat')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#FFD54F]/60 shadow-xl shadow-[#FFD54F]/5 transition-all duration-300 flex flex-col justify-between group relative cursor-pointer"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#FFD54F] text-black font-extrabold text-[10px] uppercase tracking-wider">
                Recommended Standard
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFD54F]/20 border border-[#FFD54F]/40 flex items-center justify-center text-[#FFD54F] group-hover:scale-110 transition-transform">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-md bg-[#FFD54F]/20 border border-[#FFD54F]/40 text-[#FFD54F] text-xs font-mono font-bold">30B PARAMETERS</span>
                </div>
                <h3 className="text-2xl font-bold text-[#F5F5F5] mb-2">Anacleto Medium</h3>
                <p className="text-[#BDBDBD] text-sm leading-relaxed mb-6">
                  Versatile reasoning model featuring step-by-step internal thought synthesis for complex analysis, coding, and problem-solving.
                </p>
              </div>
              <div className="space-y-2 pt-4 border-t border-[#333333] text-xs text-[#BDBDBD] font-mono">
                <div className="flex justify-between"><span>Context Window:</span> <span className="text-[#F5F5F5]">128,000 tokens</span></div>
                <div className="flex justify-between"><span>Primary Use:</span> <span className="text-[#F5F5F5]">General AI, Code & Reasoning</span></div>
              </div>
            </div>

            {/* Anacleto Large */}
            <div 
              onClick={() => router.push('/chat')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="px-3 py-1 rounded-md bg-[#FFD54F]/10 border border-[#FFD54F]/30 text-[#FFD54F] text-xs font-mono font-bold">120B PARAMETERS</span>
                </div>
                <h3 className="text-2xl font-bold text-[#F5F5F5] mb-2">Anacleto Large</h3>
                <p className="text-[#BDBDBD] text-sm leading-relaxed mb-6">
                  Our flagship sovereign model delivering top-tier benchmark performance on scientific research, legal discovery, and complex decision-making.
                </p>
              </div>
              <div className="space-y-2 pt-4 border-t border-[#333333] text-xs text-[#BDBDBD] font-mono">
                <div className="flex justify-between"><span>Context Window:</span> <span className="text-[#F5F5F5]">128,000 tokens</span></div>
                <div className="flex justify-between"><span>Primary Use:</span> <span className="text-[#F5F5F5]">Frontier R&D, Air-Gapped LLM</span></div>
              </div>
            </div>

          </div>
        </div>

        {/* 2. DEVELOPER SOLUTIONS */}
        <div id="products" className="my-16 pt-8 border-t border-[#333333] scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight uppercase">
              Developer Solutions
            </h2>
            <p className="text-[#BDBDBD] text-sm sm:text-base mt-3">
              High-throughput developer APIs and specialized autonomous AI agents built for code generation and general workflow automation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Developer APIs */}
            <div 
              onClick={() => router.push('/developer-center')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">High-Throughput APIs</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed mb-4">
                OpenAI-compatible REST and streaming chat endpoints. Easily swap base URLs to route queries to Anacleto models with zero code friction.
              </p>
              <div className="p-3 bg-[#121212] rounded-lg border border-[#333333] font-mono text-xs text-[#FFD54F]">
                POST /v1/chat/completions
              </div>
            </div>

            {/* Anacleto Code */}
            <div 
              onClick={() => router.push('/solutions/developer')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Anacleto Code</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed mb-4">
                Autonomous pair-programming agent capable of repository navigation, code generation, refactoring, and automated unit test execution.
              </p>
              <div className="p-3 bg-[#121212] rounded-lg border border-[#333333] font-mono text-xs text-[#BDBDBD]">
                Autonomous Pair Programmer
              </div>
            </div>

            {/* Anacleto Agent */}
            <div 
              onClick={() => router.push('/solutions/developer')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Anacleto Agent</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed mb-4">
                General-purpose autonomous agent with multi-step tool execution, live web search, document parsing, and workflow automation.
              </p>
              <div className="p-3 bg-[#121212] rounded-lg border border-[#333333] font-mono text-xs text-[#BDBDBD]">
                General Workflow Automation
              </div>
            </div>

          </div>
        </div>

        {/* 3. ENTERPRISE B2B SERVICES */}
        <div id="services" className="my-16 pt-8 border-t border-[#333333] scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight uppercase">
              Enterprise AI Solutions
            </h2>
            <p className="text-[#BDBDBD] text-sm sm:text-base mt-3">
              Specialized B2B services engineered for highly regulated sectors requiring absolute data sovereignty and compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* 1. Enterprise Access to Anacleto Models */}
            <div 
              onClick={() => router.push('/contact')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Enterprise Access to Anacleto Models</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Dedicated private API throughput, SLA-backed compute clusters, and sovereign access to Anacleto Small, Medium, and Large models.
              </p>
            </div>

            {/* 2. Custom Fine-Tuning & Model Distillation */}
            <div 
              onClick={() => router.push('/solutions/enterprise')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Fine-Tuning & Model Distillation</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Custom fine-tuning on your private domain datasets with dedicated weight hosting, plus model distillation into 3B/7B edge models.
              </p>
            </div>

            {/* 3. Sovereign RAG */}
            <div 
              onClick={() => router.push('/solutions/enterprise')}
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

            {/* 4. AI Appliance */}
            <div 
              onClick={() => router.push('/solutions/enterprise')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">The "AI Appliance"</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Pre-loaded physical rack servers deployed on-premise inside your intranet. Zero outbound connections, ultimate security.
              </p>
            </div>

            {/* 5. Vertical Autonomous Agents */}
            <div 
              onClick={() => router.push('/solutions/enterprise')}
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

            {/* 6. Sovereign Red Teaming & Compliance */}
            <div 
              onClick={() => router.push('/solutions/enterprise')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Sovereign Red Teaming & Compliance</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed">
                Aggressive security auditing, adversarial attacks, and compliance readiness against the EU AI Act and GDPR frameworks.
              </p>
            </div>

          </div>
        </div>

        {/* 4. CREATOR SOLUTIONS */}
        <div id="creator-solutions" className="my-16 pt-8 border-t border-[#333333] scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight uppercase">
              Creator Solutions
            </h2>
            <p className="text-[#BDBDBD] text-sm sm:text-base mt-3">
              Empowering content creators with sovereign AI tools for seamless digital media generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Image Generation */}
            <div 
              onClick={() => router.push('/solutions/creator')}
              className="p-6 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-4 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Image Generation</h3>
              <p className="text-[#BDBDBD] text-xs leading-relaxed flex-1">
                Generate high-fidelity, production-ready images from text prompts tailored to your specific brand aesthetic.
              </p>
            </div>

            {/* Video Generation */}
            <div 
              onClick={() => router.push('/solutions/creator')}
              className="p-6 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-4 group-hover:scale-110 transition-transform">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Video Generation</h3>
              <p className="text-[#BDBDBD] text-xs leading-relaxed flex-1">
                Automate video script generation and seamlessly render cinematic video sequences without external studios.
              </p>
            </div>

            {/* 3D Models Generation */}
            <div 
              onClick={() => router.push('/solutions/creator')}
              className="p-6 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-4 group-hover:scale-110 transition-transform">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">3D Models Generation</h3>
              <p className="text-[#BDBDBD] text-xs leading-relaxed flex-1">
                Instantly convert flat concepts into rigged 3D models for gaming, animation, and virtual reality workflows.
              </p>
            </div>

            {/* Audio Generation */}
            <div 
              onClick={() => router.push('/solutions/creator')}
              className="p-6 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-4 group-hover:scale-110 transition-transform">
                <Music className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Audio Generation</h3>
              <p className="text-[#BDBDBD] text-xs leading-relaxed flex-1">
                Synthesize realistic voiceovers, sound effects, and adaptive background music using sovereign audio models.
              </p>
            </div>
            
          </div>
        </div>

        {/* 5. EDUCATION SOLUTIONS */}
        <div id="education-solutions" className="my-16 pt-8 border-t border-[#333333] scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight uppercase">
              Education Solutions
            </h2>
            <p className="text-[#BDBDBD] text-sm sm:text-base mt-3">
              Specialized services for teaching, giving educators ultimate control while AI actively guides students through the learning process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* AI Assisted Learning */}
            <div 
              onClick={() => router.push('/solutions/education')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">AI Assisted Learning</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed mb-4">
                Personalized AI tutors that adapt to individual student pacing, explaining complex concepts without simply giving away the answers.
              </p>
            </div>

            {/* AI Practician */}
            <div 
              onClick={() => router.push('/solutions/education')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Interactive Practician</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed mb-4">
                Dynamic testing environments where AI generates bespoke practice problems, evaluates student work, and provides constructive feedback in real-time.
              </p>
            </div>

            {/* Guided Lesson Workflows */}
            <div 
              onClick={() => router.push('/solutions/education')}
              className="p-8 rounded-xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Guided Lesson Workflows</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed mb-4">
                Educators author the core lesson plans, and the AI actively assists the student, pacing them through the material strictly following the teacher's designed curriculum.
              </p>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};
