import React from 'react';
import { Sparkles, Image as ImageIcon, Video, Music, Box, UploadCloud, Download, Layout, Palette } from 'lucide-react';

export const CreatorCenterView: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#0b0b0d] text-zinc-100 font-sans selection:bg-zinc-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#FFD54F]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] uppercase tracking-tight">Creator Center</h1>
              <p className="text-xs text-[#BDBDBD] mt-1 font-mono">Sovereign Asset Generation Studio</p>
            </div>
          </div>
          <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
            Welcome to the Creator Center. Access our specialized generation models to create high-fidelity images, 3D assets, audio, and video content directly in your browser. All generations are private and securely stored in your workspace.
          </p>
        </div>

        {/* Studio Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Image Generation */}
          <div className="bg-[#121214] border border-zinc-800 hover:border-[#FFD54F]/50 rounded-2xl p-6 transition-all group cursor-pointer shadow-lg flex flex-col h-full">
            <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-5 h-5 text-zinc-300 group-hover:text-[#FFD54F] transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Image Studio</h3>
            <p className="text-xs text-zinc-500 mb-6 flex-1">Generate ultra-realistic images or stylized art from text descriptions. Includes in-painting and upscaling capabilities.</p>
            <button className="w-full py-2.5 rounded-lg bg-zinc-800 group-hover:bg-[#FFD54F] group-hover:text-black text-xs font-bold uppercase tracking-wider transition-all">
              Launch Studio
            </button>
          </div>

          {/* 3D Generation */}
          <div className="bg-[#121214] border border-zinc-800 hover:border-[#FFD54F]/50 rounded-2xl p-6 transition-all group cursor-pointer shadow-lg flex flex-col h-full">
            <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Box className="w-5 h-5 text-zinc-300 group-hover:text-[#FFD54F] transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">3D Asset Gen</h3>
            <p className="text-xs text-zinc-500 mb-6 flex-1">Create textured 3D models (GLTF/OBJ) from text or 2D image references for game engines and AR/VR.</p>
            <button className="w-full py-2.5 rounded-lg bg-zinc-800 group-hover:bg-[#FFD54F] group-hover:text-black text-xs font-bold uppercase tracking-wider transition-all">
              Launch Studio
            </button>
          </div>

          {/* Video Generation */}
          <div className="bg-[#121214] border border-zinc-800 hover:border-[#FFD54F]/50 rounded-2xl p-6 transition-all group cursor-pointer shadow-lg flex flex-col h-full">
            <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5 text-zinc-300 group-hover:text-[#FFD54F] transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Video Forge</h3>
            <p className="text-xs text-zinc-500 mb-6 flex-1">Animate still images or generate short video clips with highly consistent physics and motion.</p>
            <button className="w-full py-2.5 rounded-lg bg-zinc-800 group-hover:bg-[#FFD54F] group-hover:text-black text-xs font-bold uppercase tracking-wider transition-all">
              Launch Studio
            </button>
          </div>

          {/* Audio Generation */}
          <div className="bg-[#121214] border border-zinc-800 hover:border-[#FFD54F]/50 rounded-2xl p-6 transition-all group cursor-pointer shadow-lg flex flex-col h-full">
            <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Music className="w-5 h-5 text-zinc-300 group-hover:text-[#FFD54F] transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Audio Synth</h3>
            <p className="text-xs text-zinc-500 mb-6 flex-1">Generate background music, sound effects, or ultra-realistic text-to-speech voiceovers.</p>
            <button className="w-full py-2.5 rounded-lg bg-zinc-800 group-hover:bg-[#FFD54F] group-hover:text-black text-xs font-bold uppercase tracking-wider transition-all">
              Launch Studio
            </button>
          </div>

        </div>

        {/* Recent Assets / Workspace placeholder */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
              <Layout className="w-5 h-5 text-[#FFD54F]" /> Recent Assets
            </h2>
            <button className="text-xs text-[#FFD54F] hover:text-white transition-colors">View All</button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
            <Palette className="w-8 h-8 text-zinc-600 mb-3" />
            <p className="text-sm font-semibold text-zinc-400">Your creative workspace is empty.</p>
            <p className="text-xs text-zinc-500 mt-1 mb-4">Start generating assets using the studios above.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
