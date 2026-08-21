import React from 'react';
import { Terminal, Building2, Sparkles, GraduationCap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SolutionsHubPage() {
  const solutions = [
    {
      title: 'Developer Solutions',
      description: 'High-throughput APIs, autonomous pair-programming agents, and workflow automation tools for engineering teams.',
      icon: <Terminal className="w-8 h-8" />,
      link: '/solutions/developer',
      color: 'border-[#FFD54F]'
    },
    {
      title: 'Enterprise Solutions',
      description: 'Sovereign RAG, physical AI appliances, model distillation, and rigorous compliance for regulated industries.',
      icon: <Building2 className="w-8 h-8" />,
      link: '/solutions/enterprise',
      color: 'border-[#FFD54F]'
    },
    {
      title: 'Creator Solutions',
      description: 'Production-ready generative AI for images, video, 3D models, and audio. Fine-tune on your own brand assets privately.',
      icon: <Sparkles className="w-8 h-8" />,
      link: '/solutions/creator',
      color: 'border-[#FFD54F]'
    },
    {
      title: 'Education Solutions',
      description: 'Guided lesson workflows, personalized AI tutors, and interactive practicians strictly constrained to syllabi.',
      icon: <GraduationCap className="w-8 h-8" />,
      link: '/solutions/education',
      color: 'border-[#FFD54F]'
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFD54F]/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F5F5F5] mb-6 uppercase">
            All <span className="text-[#FFD54F]">Solutions</span>
          </h1>
          <p className="text-lg text-[#BDBDBD] leading-relaxed">
            Choose your vertical to explore how Anacleto's sovereign AI models and agents can securely transform your workflows.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {solutions.map((sol) => (
            <Link 
              key={sol.link} 
              href={sol.link}
              className="p-8 rounded-3xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/60 hover:bg-[#1A1A1A]/80 transition-all duration-300 group flex flex-col"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
                {sol.icon}
              </div>
              <h3 className="text-3xl font-bold text-[#F5F5F5] mb-4">{sol.title}</h3>
              <p className="text-[#BDBDBD] text-sm leading-relaxed mb-8 flex-1">
                {sol.description}
              </p>
              <div className="flex items-center gap-2 text-[#FFD54F] font-bold uppercase tracking-wider text-sm">
                Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
