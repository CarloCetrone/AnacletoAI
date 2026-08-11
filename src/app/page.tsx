'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HomeView } from '@/components/HomeView';
import { LoginView } from '@/components/LoginView';
import { SecureChatView } from '@/components/SecureChatView';
import { ContactView } from '@/components/ContactView';
import { ApiPlaygroundView } from '@/components/ApiPlaygroundView';
import { DashboardView } from '@/components/DashboardView';
import { ServiceDetailView } from '@/components/ServiceDetailView';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';

function MainAppContent() {
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'chat' | 'contact' | 'api-docs' | 'dashboard' | 'service-detail' | 'solutions'>('home');
  const [currentServiceId, setCurrentServiceId] = useState<string>('');
  const { user, profile } = useAuth();

  const navigateTo = (view: string, serviceId?: string) => {
    if (serviceId) setCurrentServiceId(serviceId);
    setCurrentView(view as any);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
      case 'solutions':
        return <HomeView onNavigate={navigateTo} />;
      case 'login':
        return <LoginView onNavigate={navigateTo} />;
      case 'api-docs':
        if (!user) {
          setCurrentView('login');
          return null;
        }
        if (profile?.accountType === 'standard') {
          setCurrentView('dashboard');
          return null;
        }
        return <ApiPlaygroundView />;
      case 'chat':
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
      case 'dashboard':
        if (!user) {
          setCurrentView('login');
          return null;
        }
        return <DashboardView onNavigate={navigateTo} />;
      case 'service-detail':
        if (!user) {
          setCurrentView('login');
          return null;
        }
        if (profile?.accountType !== 'enterprise') {
          setCurrentView('dashboard');
          return null;
        }
        return <ServiceDetailView serviceId={currentServiceId} onNavigate={navigateTo} />;
      case 'contact':
        return <ContactView />;
      default:
        return <HomeView onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-amber-400 selection:text-zinc-950 bg-grid-pattern relative">
      <Navbar currentView={currentView} setCurrentView={navigateTo} />
      
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
