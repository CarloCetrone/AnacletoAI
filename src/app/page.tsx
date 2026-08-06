'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HomeView } from '@/components/HomeView';
import { LoginView } from '@/components/LoginView';
import { SecureChatView } from '@/components/SecureChatView';
import { ContactView } from '@/components/ContactView';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';

function MainAppContent() {
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'chat' | 'contact'>('home');
  const { user } = useAuth();

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onNavigate={(view) => setCurrentView(view as any)} />;
      case 'login':
        return <LoginView onNavigate={(view) => setCurrentView(view as any)} />;
      case 'chat':
        // Protected Route Check
        if (!user) {
          return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-[#1A1A1A] border border-[#333333] rounded-2xl p-8 text-center space-y-4 shadow-2xl">
                <div className="inline-flex p-3 rounded-xl bg-[#FFD54F]/10 text-[#FFD54F] border border-[#FFD54F]/30 mb-2">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-wider text-[#F5F5F5]">
                  Authentication Required
                </h2>
                <p className="text-xs text-[#BDBDBD]">
                  Accessing sovereign chat models and endpoint consoles requires a verified user login session under GDPR compliance rules.
                </p>
                <button
                  onClick={() => setCurrentView('login')}
                  className="w-full py-3 px-4 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  Sign In to Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        }
        return <SecureChatView />;
      case 'contact':
        return <ContactView />;
      default:
        return <HomeView onNavigate={(view) => setCurrentView(view as any)} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-amber-400 selection:text-zinc-950 bg-grid-pattern relative">
      <Navbar currentView={currentView} setCurrentView={(view) => setCurrentView(view as any)} />
      
      <main className="flex-1 pt-16">
        {renderView()}
      </main>

      {currentView !== 'chat' && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
