import React, { useState } from 'react';
import { ShieldCheck, Globe } from 'lucide-react';
import { PrivacyPolicyModal } from '@/components/PrivacyPolicyModal';

export const Footer: React.FC = () => {
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <>
      <footer className="w-full border-t border-[#333333] bg-[#121212] py-8 px-4 relative z-10 text-[#BDBDBD] text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-[#BDBDBD]">
            <ShieldCheck className="w-4 h-4 text-[#FFD54F]" />
            <span>© 2026 Anacleto AI. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-[#BDBDBD]">
            <button
              onClick={() => setPrivacyOpen(true)}
              className="flex items-center gap-1.5 hover:text-[#FFD54F] transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFD54F]" />
              GDPR Privacy Policy
            </button>
            <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
              <Globe className="w-3.5 h-3.5 text-[#FFD54F]" />
              EU Based
            </span>
          </div>
        </div>
      </footer>

      <PrivacyPolicyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
    </>
  );
};
