import React from 'react';
import { Image as ImageIcon, Video, Box, Music, Sparkles, ArrowRight, Zap, Play } from 'lucide-react';
import Link from 'next/link';

export default function CreatorSolutionsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FFD54F]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#FFD54F]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1A] border border-[#FFD54F]/30 text-[#FFD54F] text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Built for Modern Content Creators</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F5F5F5] mb-6 uppercase">
            Generate at the <span className="text-[#FFD54F]">Speed of Thought</span>
          </h1>
          <p className="text-lg text-[#BDBDBD] leading-relaxed max-w-3xl mx-auto">
            Our sovereign AI studio provides cutting-edge generative models for image, video, 3D, and audio. Fine-tune on your own brand assets without compromising copyright or sharing your data with external platforms.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          
          {/* Image Gen */}
          <div className="p-8 rounded-3xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">Hyper-Real Image Generation</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed mb-6">
              Create stunning, production-ready images in seconds. Train personalized LoRAs on your own face, products, or artistic style to maintain absolute brand consistency across all campaigns.
            </p>
            <ul className="space-y-2 text-sm text-[#F5F5F5]">
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#FFD54F]" /> Resolution up to 4K</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#FFD54F]" /> Style-consistent characters</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#FFD54F]" /> Instant inpainting & outpainting</li>
            </ul>
          </div>

          {/* Video Gen */}
          <div className="p-8 rounded-3xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Video className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">Cinematic Video Synthesis</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed mb-6">
              Turn text prompts or static images into fluid, highly coherent video clips. Automate b-roll generation for YouTube or create entirely synthetic ads with perfect physics.
            </p>
            <ul className="space-y-2 text-sm text-[#F5F5F5]">
              <li className="flex items-center gap-2"><Play className="w-4 h-4 text-[#FFD54F]" /> 60fps Smooth Motion</li>
              <li className="flex items-center gap-2"><Play className="w-4 h-4 text-[#FFD54F]" /> Text-to-Video & Image-to-Video</li>
              <li className="flex items-center gap-2"><Play className="w-4 h-4 text-[#FFD54F]" /> Consistent physics & lighting</li>
            </ul>
          </div>

          {/* 3D Models */}
          <div className="p-8 rounded-3xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Box className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">Instant 3D Assets</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed mb-6">
              Generate fully rigged 3D models from text or 2D images. Export seamlessly to Blender, Unreal Engine, or Unity for fast-paced game development and VTubing.
            </p>
            <ul className="space-y-2 text-sm text-[#F5F5F5]">
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-[#FFD54F]" /> GLTF & OBJ Export</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-[#FFD54F]" /> Auto-Rigging for animation</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-[#FFD54F]" /> PBR Materials & Textures</li>
            </ul>
          </div>

          {/* Audio */}
          <div className="p-8 rounded-3xl bg-[#1A1A1A] border border-[#333333] hover:border-[#FFD54F]/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 flex items-center justify-center text-[#FFD54F] mb-6 group-hover:scale-110 transition-transform">
              <Music className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">Sovereign Audio & Voice</h3>
            <p className="text-[#BDBDBD] text-sm leading-relaxed mb-6">
              Clone voices with a 10-second sample (ethically and privately) for automated podcasting, or generate royalty-free background tracks matching the exact mood of your scenes.
            </p>
            <ul className="space-y-2 text-sm text-[#F5F5F5]">
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-[#FFD54F]" /> Zero-shot Voice Cloning</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-[#FFD54F]" /> Multi-language TTS</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-[#FFD54F]" /> Adaptive Music Generation</li>
            </ul>
          </div>

        </div>

        {/* CTA */}
        <div className="flex justify-center mt-12">
          <Link href="/contact" className="px-8 py-4 rounded-xl bg-[#FFD54F] text-[#000000] font-bold uppercase tracking-wider hover:bg-[#FFCA28] transition-colors flex items-center gap-2 shadow-lg shadow-[#FFD54F]/20">
            Join the Creator Beta
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
