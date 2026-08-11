import React, { useState } from 'react';
import { X, User, ShieldCheck, Download, Trash2, KeyRound, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { profile, exportUserData, deleteUserAccount, isConfigured, updateAccountType } = useAuth();
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !profile) return null;

  const handleExport = () => {
    exportUserData();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handleDelete = async () => {
    await deleteUserAccount();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl w-full max-w-xl p-6 md:p-8 shadow-2xl relative text-[#F5F5F5]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333333] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FFD54F]/10 border border-[#FFD54F]/20 text-[#FFD54F]">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider text-[#F5F5F5]">
                Account & Privacy Dashboard
              </h2>
              <p className="text-xs text-[#BDBDBD]">
                GDPR Data Subject Rights & Security Settings
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

        <div className="space-y-6">
          
          {/* User Profile Card */}
          <div className="p-4 rounded-xl bg-[#121212] border border-[#333333] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#BDBDBD] block uppercase tracking-wider">Signed in as</span>
              <strong className="text-sm font-semibold text-[#F5F5F5]">{profile.email}</strong>
              <span className="text-[10px] text-[#666666] block mt-0.5">User ID: {profile.id}</span>
              <span className="text-[10px] text-[#FFD54F] block mt-0.5 font-bold uppercase">Account Type: {profile.accountType}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#FFD54F]/10 text-[#FFD54F] border border-[#FFD54F]/30">
              {isConfigured ? 'EU Cloud Session' : 'Demo Local Session'}
            </span>
          </div>

          {/* Account Type Management */}
          <div className="p-4 rounded-xl bg-[#121212] border border-[#333333] space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F5F5]">
              <User className="w-4 h-4 text-[#FFD54F]" />
              Account Type
            </div>
            <p className="text-xs text-[#BDBDBD]">
              Switch your account type to access different dashboard tools and limits.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateAccountType('standard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  profile.accountType === 'standard' ? 'bg-[#FFD54F]/20 text-[#FFD54F] border border-[#FFD54F]/50' : 'bg-[#252525] text-[#666666] border border-[#333333] hover:text-[#BDBDBD]'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => updateAccountType('developer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  profile.accountType === 'developer' ? 'bg-[#FFD54F]/20 text-[#FFD54F] border border-[#FFD54F]/50' : 'bg-[#252525] text-[#666666] border border-[#333333] hover:text-[#BDBDBD]'
                }`}
              >
                Developer
              </button>
              <button
                type="button"
                onClick={() => updateAccountType('enterprise')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  profile.accountType === 'enterprise' ? 'bg-[#FFD54F]/20 text-[#FFD54F] border border-[#FFD54F]/50' : 'bg-[#252525] text-[#666666] border border-[#333333] hover:text-[#BDBDBD]'
                }`}
              >
                Enterprise
              </button>
            </div>
          </div>

          {/* Security & Multi-Factor Auth */}
          <div className="p-4 rounded-xl bg-[#121212] border border-[#333333] space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F5F5]">
              <KeyRound className="w-4 h-4 text-[#FFD54F]" />
              Multi-Factor Authentication (MFA / TOTP)
            </div>
            <p className="text-xs text-[#BDBDBD]">
              Enhance account sovereignty with Google Authenticator or Authy 2-Factor code verification.
            </p>
            <button
              type="button"
              onClick={() => alert('MFA setup is active on your Supabase Auth dashboard.')}
              className="px-3.5 py-2 rounded-lg bg-[#252525] hover:bg-[#333333] text-xs font-semibold text-[#FFD54F] border border-[#FFD54F]/20 transition-all"
            >
              Configure 2FA Authenticator
            </button>
          </div>

          {/* GDPR Art. 20 - Export My Data */}
          <div className="p-4 rounded-xl bg-[#121212] border border-[#333333] space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F5F5]">
              <Download className="w-4 h-4 text-[#FFD54F]" />
              Right to Data Portability (Article 20 GDPR)
            </div>
            <p className="text-xs text-[#BDBDBD]">
              Download an encrypted JSON file containing all personal data, consent logs, and account metadata stored on EU servers.
            </p>
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-[#FFD54F]/10 hover:bg-[#FFD54F]/20 text-xs font-bold text-[#FFD54F] border border-[#FFD54F]/30 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export My Data (JSON)
            </button>
            {downloadSuccess && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-2 font-medium">
                <CheckCircle className="w-4 h-4" /> GDPR Data file downloaded successfully!
              </p>
            )}
          </div>

          {/* GDPR Art. 17 - Delete My Account */}
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
              <Trash2 className="w-4 h-4" />
              Right to be Forgotten (Article 17 GDPR)
            </div>
            <p className="text-xs text-red-200/70">
              Permanently delete your account and remove all personal information from our database. This action is irreversible.
            </p>
            
            {!deleteConfirming ? (
              <button
                type="button"
                onClick={() => setDeleteConfirming(true)}
                className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-xs font-bold text-red-400 border border-red-500/30 transition-all"
              >
                Delete Account & Erase Data
              </button>
            ) : (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-600/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                  <AlertTriangle className="w-4 h-4" />
                  Are you absolutely sure? All data will be permanently erased.
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                  >
                    Yes, Permanently Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirming(false)}
                    className="px-3 py-1.5 rounded bg-[#252525] text-xs text-[#BDBDBD] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
