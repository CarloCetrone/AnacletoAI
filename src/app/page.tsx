'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HomeView } from '@/components/HomeView';
import { LoginView } from '@/components/LoginView';
import { SecureChatView } from '@/components/SecureChatView';
import { ContactView } from '@/components/ContactView';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'chat' | 'contact'>('home');

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onNavigate={(view) => setCurrentView(view as any)} />;
      case 'login':
        return <LoginView onNavigate={(view) => setCurrentView(view as any)} />;
      case 'chat':
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
      
      <main className="flex-1">
        {renderView()}
      </main>

      {currentView !== 'chat' && <Footer />}
    </div>
  );
}
