import React from 'react';
import { ShieldCheck, Lock, Globe, Atom } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#333333] bg-[#121212] py-8 px-4 relative z-10 text-[#BDBDBD] text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-[#BDBDBD]">
          <ShieldCheck className="w-4 h-4 text-[#FFD54F]" />
          <span>© 2026 Anacleto AI Research Lab. EU AI Act & GDPR Ready. 100% Sovereign Data.</span>
        </div>

        <div className="flex items-center space-x-6 text-xs text-[#BDBDBD]">
          <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
            <Atom className="w-3.5 h-3.5 text-[#FFD54F]" />
            Frontier AI Lab
          </span>
          <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
            <Lock className="w-3.5 h-3.5 text-[#FFD54F]" />
            ISO 27001 Certified
          </span>
          <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
            <Globe className="w-3.5 h-3.5 text-[#FFD54F]" />
            EU On-Prem & API
          </span>
        </div>
      </div>
    </footer>
  );
};
