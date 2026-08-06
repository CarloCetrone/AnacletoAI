import React from 'react';
import { X, ShieldCheck, Lock, Database, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative text-[#F5F5F5]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333333] pb-4 mb-6 sticky top-0 bg-[#1A1A1A] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 text-[#FFD54F]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider text-[#F5F5F5]">
                Privacy Policy & GDPR Compliance Notice
              </h2>
              <p className="text-xs text-[#BDBDBD]">
                Regulation (EU) 2016/679 (General Data Protection Regulation)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#BDBDBD] hover:text-[#FFD54F] hover:bg-[#252525] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-[#CCCCCC] leading-relaxed">
          
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-[#121212] border border-[#FFD54F]/30 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#FFD54F] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#FFD54F] block font-semibold mb-1">EU Data Sovereignty Guaranteed</strong>
              All user data, authentication credentials, and database records are hosted strictly within the European Union (Frankfurt, Germany - AWS `eu-central-1`). Zero personal data is transferred outside the EEA.
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FFD54F]" />
              1. Data Controller
            </h3>
            <p>
              Anacleto AI Systems (&quot;Anacleto AI&quot;, &quot;we&quot;, &quot;our&quot;) acts as the Data Controller under Article 4(7) GDPR. For privacy inquiries or exercising your rights under GDPR, contact our Data Protection Office at <span className="text-[#FFD54F]">privacy@anacletoai.com</span>.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#FFD54F]" />
              2. Data We Collect & Legal Basis (Article 6 GDPR)
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-[#BDBDBD]">
              <li>
                <strong className="text-[#F5F5F5]">Account Credentials (Email & Password Hash)</strong>: Processed under Art. 6(1)(b) GDPR (Contract Performance) to provide secure access to your AI workspace.
              </li>
              <li>
                <strong className="text-[#F5F5F5]">Consent & Audit Timestamps</strong>: Recorded under Art. 6(1)(c) GDPR (Legal Obligation) to demonstrate explicit consent.
              </li>
              <li>
                <strong className="text-[#F5F5F5]">Technical Session Tokens</strong>: Essential short-lived authentication JWT tokens (exempt from cookie consent under ePrivacy Directive).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#FFD54F]" />
              3. Security Standards (Article 32 GDPR)
            </h3>
            <p className="text-xs sm:text-sm">
              We employ bank-grade security measures including PKCE OAuth 2.0 architecture, bcrypt/Argon2id password hashing, TLS 1.3 encryption in transit, and AES-256 encryption at rest. Passwords are never accessible to our personnel or stored in plain text.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FFD54F]" />
              4. Your Data Protection Rights (Articles 15–22 GDPR)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#121212] border border-[#333333]">
                <strong className="text-[#FFD54F] block mb-1">Right of Access & Portability (Art. 15 & 20)</strong>
                Download a machine-readable JSON copy of all your data directly in your Account Settings.
              </div>
              <div className="p-3 rounded-lg bg-[#121212] border border-[#333333]">
                <strong className="text-[#FFD54F] block mb-1">Right to Erasure / Forgotten (Art. 17)</strong>
                Instantly delete your account and remove all personal data permanently from our EU servers.
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-[#333333] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-bold text-xs uppercase tracking-wider transition-colors"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
