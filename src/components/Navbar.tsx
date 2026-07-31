import React from 'react';
import Image from 'next/image';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#121212]/90 border-b border-[#333333] transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentView('home')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#1A1A1A] border border-[#FFD54F]/40 p-0.5 shadow-lg shadow-[#FFD54F]/10 group-hover:border-[#FFD54F] transition-all">
            <Image
              src="/logo.png"
              alt="Anacleto AI Logo"
              fill
              className="object-cover rounded-[10px]"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[#F5F5F5] flex items-center gap-1">
              ANACLETO <span className="text-[#FFD54F]">AI</span>
            </span>
            <span className="text-[10px] tracking-wider text-[#BDBDBD] uppercase font-mono">Frontier AI & Research</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => setCurrentView('home')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentView === 'home'
                ? 'text-[#FFD54F] bg-[#1A1A1A]'
                : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentView('contact')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentView === 'contact'
                ? 'text-[#FFD54F] bg-[#1A1A1A]'
                : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
            }`}
          >
            Contact
          </button>
          <button
            onClick={() => setCurrentView('login')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentView === 'login'
                ? 'text-[#FFD54F] bg-[#1A1A1A]'
                : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
            }`}
          >
            Login
          </button>
        </nav>

        {/* CTA Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('chat')}
            className="px-4 py-2 rounded-md bg-transparent border border-[#FFD54F] text-[#FFD54F] hover:bg-[#FFD54F] hover:text-[#000000] font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#FFD54F]/10 flex items-center gap-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD54F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD54F]"></span>
            </span>
            Try Anacleto Chat
          </button>
        </div>
      </div>
    </header>
  );
};
