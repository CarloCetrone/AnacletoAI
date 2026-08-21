import React from 'react';
import { GraduationCap, BookOpen, PenTool, CheckCircle2, ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';

export default function EducationSolutionsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 relative overflow-hidden">
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-[#FFD54F]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-[#FFD54F]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1A] border border-[#FFD54F]/30 text-[#FFD54F] text-sm font-semibold mb-6">
            <GraduationCap className="w-4 h-4" />
            <span>The Future of Sovereign EdTech</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F5F5F5] mb-6 uppercase">
            Teaching Amplified by <span className="text-[#FFD54F]">AI Intelligence</span>
          </h1>
          <p className="text-lg text-[#BDBDBD] leading-relaxed max-w-3xl mx-auto">
            Give every student a world-class personalized tutor while maintaining complete control over the curriculum. Our education models are strictly constrained to follow the teacher's lesson plans without hallucination.
          </p>
        </div>

        {/* Feature 1: Guided Lesson Workflows */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-24 bg-[#1A1A1A] border border-[#333333] p-8 md:p-12 rounded-3xl shadow-xl shadow-[#FFD54F]/5">
          <div className="flex-1">
            <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/30 flex items-center justify-center text-[#FFD54F] mb-6">
              <PenTool className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-[#F5F5F5] mb-4">Guided Lesson Workflows</h2>
            <p className="text-[#BDBDBD] leading-relaxed mb-6">
              Educators remain at the center of the experience. You author the core lesson plans, facts, and boundaries. The AI actively assists the student, pacing them through the material strictly following your designed curriculum—refusing to answer questions outside the scope of the lesson.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-[#F5F5F5]"><CheckCircle2 className="w-5 h-5 text-[#FFD54F]" /> Guaranteed alignment with syllabi</li>
              <li className="flex items-center gap-3 text-sm text-[#F5F5F5]"><CheckCircle2 className="w-5 h-5 text-[#FFD54F]" /> Socratic method mode prevents simply giving answers</li>
              <li className="flex items-center gap-3 text-sm text-[#F5F5F5]"><CheckCircle2 className="w-5 h-5 text-[#FFD54F]" /> Secure content boundaries block inappropriate queries</li>
            </ul>
          </div>
          <div className="flex-1 w-full bg-[#121212] border border-[#333333] rounded-2xl p-6 font-mono text-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-4 border-b border-[#333333] pb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-[#BDBDBD] ml-2">Teacher Console</span>
            </div>
            <div className="text-[#FFD54F] mb-2">// Lesson Constraint Config</div>
            <div className="text-[#F5F5F5]">
              <span className="text-[#FFD54F]">const</span> lesson = {'{'}
            </div>
            <div className="text-[#F5F5F5] ml-4">
              topic: <span className="text-[#FFCA28]">"Photosynthesis"</span>,<br/>
              gradeLevel: <span className="text-blue-400">8</span>,<br/>
              rules: [<br/>
              <span className="text-[#FFCA28] ml-4">"Do not provide direct answers."</span>,<br/>
              <span className="text-[#FFCA28] ml-4">"Guide using Socratic questioning."</span>,<br/>
              <span className="text-[#FFCA28] ml-4">"Only use facts from attached PDF."</span><br/>
              ]
            </div>
            <div className="text-[#F5F5F5]">{'}'};</div>
          </div>
        </div>

        {/* 2 Column Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          
          {/* AI Assisted Learning */}
          <div className="p-8 rounded-3xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/30 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">AI Assisted Learning</h3>
            <p className="text-[#BDBDBD] leading-relaxed">
              1-on-1 personalized AI tutors that adapt to individual student pacing. The model identifies knowledge gaps in real-time and dynamically re-explains complex concepts using analogies tailored to the student's interests (e.g., explaining physics through basketball).
            </p>
          </div>

          {/* Interactive Practician */}
          <div className="p-8 rounded-3xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/30 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">Interactive Practician</h3>
            <p className="text-[#BDBDBD] leading-relaxed">
              Dynamic testing environments where AI generates bespoke practice problems based on current lesson objectives. It evaluates student work, grades short essays, and provides constructive feedback in real-time, drastically reducing grading overhead for teachers.
            </p>
          </div>

        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FFD54F] text-[#000000] font-bold uppercase tracking-wider hover:bg-[#FFCA28] transition-colors shadow-lg shadow-[#FFD54F]/20">
            Request an Education Pilot
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
