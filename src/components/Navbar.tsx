'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, Settings, Menu, X, Code2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserSettingsModal } from '@/components/UserSettingsModal';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleNavClick = (sectionId?: string) => {
    setMobileMenuOpen(false);
    if (sectionId) {
      let attempts = 0;
      const scrollTarget = () => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else if (attempts < 10) {
          attempts++;
          setTimeout(scrollTarget, 100);
        }
      };
      setTimeout(scrollTarget, 50);
    }
  };

  const isHome = pathname === '/';
  const isSolutions = pathname.startsWith('/solutions');
  const isContact = pathname === '/contact';
  const isDashboard = pathname === '/dashboard';
  const isChat = pathname === '/chat';
  const isDeveloperCenter = pathname === '/developer-center';
  const isCreatorCenter = pathname === '/creator-center';
  const isEducatorCenter = pathname === '/educator-center';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#121212]/90 border-b border-[#333333] transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link 
            href="/"
            onClick={() => handleNavClick()}
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
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isHome
                  ? 'text-[#FFD54F] bg-[#1A1A1A]'
                  : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
              }`}
            >
              Home
            </Link>
            <Link
              href="/models"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/models'
                  ? 'text-[#FFD54F] bg-[#1A1A1A]'
                  : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
              }`}
            >
              Models
            </Link>
            <div className="relative group">
              <Link
                href="/solutions"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors inline-block ${
                  pathname.startsWith('/solutions')
                    ? 'text-[#FFD54F] bg-[#1A1A1A]'
                    : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
                }`}
              >
                Solutions
              </Link>
              {/* Dropdown for Solutions */}
              <div className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-[#1A1A1A] border border-[#333333] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                <Link href="/solutions/enterprise" className="block px-4 py-2 text-sm text-[#F5F5F5] hover:bg-[#252525] hover:text-[#FFD54F]">Enterprise Solutions</Link>
                <Link href="/solutions/developer" className="block px-4 py-2 text-sm text-[#F5F5F5] hover:bg-[#252525] hover:text-[#FFD54F]">Developer Solutions</Link>
                <Link href="/solutions/creator" className="block px-4 py-2 text-sm text-[#F5F5F5] hover:bg-[#252525] hover:text-[#FFD54F]">Creator Solutions</Link>
                <Link href="/solutions/education" className="block px-4 py-2 text-sm text-[#F5F5F5] hover:bg-[#252525] hover:text-[#FFD54F]">Education Solutions</Link>
              </div>
            </div>
            
            <Link
              href="/contact"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isContact
                  ? 'text-[#FFD54F] bg-[#1A1A1A]'
                  : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
              }`}
            >
              Contact Us
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isDashboard
                      ? 'text-[#FFD54F] bg-[#1A1A1A]'
                      : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
                  }`}
                >
                  Dashboard
                </Link>
                {profile?.accountType === 'developer' && (
                  <Link
                    href="/developer-center"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isDeveloperCenter
                        ? 'text-[#FFD54F] bg-[#1A1A1A]'
                        : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
                    }`}
                  >
                    Developer Center
                  </Link>
                )}
                {profile?.accountType === 'creator' && (
                  <Link
                    href="/creator-center"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isCreatorCenter
                        ? 'text-[#FFD54F] bg-[#1A1A1A]'
                        : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
                    }`}
                  >
                    Creator Center
                  </Link>
                )}
                {profile?.accountType === 'educator' && (
                  <Link
                    href="/educator-center"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isEducatorCenter
                        ? 'text-[#FFD54F] bg-[#1A1A1A]'
                        : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
                    }`}
                  >
                    Educator Center
                  </Link>
                )}
                <Link
                  href="/chat"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isChat
                      ? 'text-[#FFD54F] bg-[#1A1A1A]'
                      : 'text-[#F5F5F5] hover:text-[#FFD54F] hover:bg-[#1A1A1A]/60'
                  }`}
                >
                  Chat
                </Link>
              </>
            )}
          </nav>

          {/* User Status / CTA Button & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#333333] transition-all"
                  title={user.email || 'User Account'}
                >
                  <div className="w-6 h-6 rounded-full bg-[#FFD54F] text-black font-bold text-xs flex items-center justify-center">
                    {((profile?.username || profile?.enterpriseName || user.email)?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="text-xs text-[#F5F5F5] font-medium hidden sm:inline max-w-[120px] truncate">
                    {profile?.username || profile?.enterpriseName || profile?.email || user.email}
                  </span>
                </div>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="p-2 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#BDBDBD] hover:text-[#FFD54F] hover:bg-[#252525] transition-all"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => { await signOut(); window.location.href = '/'; }}
                  className="p-2 rounded-xl bg-[#1A1A1A] border border-[#333333] text-[#BDBDBD] hover:text-red-400 hover:bg-[#252525] transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 rounded-lg bg-[#FFD54F] text-black hover:bg-[#FFCA28] font-bold text-sm uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#FFD54F]/10 flex items-center"
              >
                Login
              </Link>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#1A1A1A] border border-[#333333] text-[#BDBDBD] hover:text-[#FFD54F] md:hidden transition-colors"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#333333] bg-[#121212] px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                isHome ? 'text-[#FFD54F] bg-[#1A1A1A]' : 'text-[#F5F5F5] hover:bg-[#1A1A1A]/60'
              }`}
            >
              Home
            </Link>
            <Link
              href="/models"
              onClick={() => setMobileMenuOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/models' ? 'text-[#FFD54F] bg-[#1A1A1A]' : 'text-[#F5F5F5] hover:bg-[#1A1A1A]/60'
              }`}
            >
              Models
            </Link>
            <div className="space-y-1">
              <div className="px-4 py-2 text-xs font-bold text-[#BDBDBD] uppercase tracking-wider">Solutions</div>
              <Link href="/solutions/enterprise" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 text-sm text-[#F5F5F5] hover:text-[#FFD54F]">Enterprise</Link>
              <Link href="/solutions/developer" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 text-sm text-[#F5F5F5] hover:text-[#FFD54F]">Developer</Link>
              <Link href="/solutions/creator" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 text-sm text-[#F5F5F5] hover:text-[#FFD54F]">Creator</Link>
              <Link href="/solutions/education" onClick={() => setMobileMenuOpen(false)} className="block px-8 py-2 text-sm text-[#F5F5F5] hover:text-[#FFD54F]">Education</Link>
            </div>
            
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                isContact ? 'text-[#FFD54F] bg-[#1A1A1A]' : 'text-[#F5F5F5] hover:bg-[#1A1A1A]/60'
              }`}
            >
              Contact Us
            </Link>
            {!user ? (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === '/login' ? 'text-[#FFD54F] bg-[#1A1A1A]' : 'text-[#F5F5F5] hover:bg-[#1A1A1A]/60'
                }`}
              >
                Login
              </Link>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                    isDashboard
                      ? 'text-[#FFD54F] bg-[#1A1A1A]' 
                      : 'text-[#F5F5F5] hover:bg-[#1A1A1A]/60'
                  }`}
                >
                  Dashboard
                </Link>
                {profile?.accountType === 'developer' && (
                  <Link
                    href="/developer-center"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                      isDeveloperCenter
                        ? 'text-[#FFD54F] bg-[#1A1A1A]' 
                        : 'text-[#F5F5F5] hover:bg-[#1A1A1A]/60'
                    }`}
                  >
                    Developer Center
                  </Link>
                )}
                {profile?.accountType === 'creator' && (
                  <Link
                    href="/creator-center"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                      isCreatorCenter
                        ? 'text-[#FFD54F] bg-[#1A1A1A]' 
                        : 'text-[#F5F5F5] hover:bg-[#1A1A1A]/60'
                    }`}
                  >
                    Creator Center
                  </Link>
                )}
                {profile?.accountType === 'educator' && (
                  <Link
                    href="/educator-center"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                      isEducatorCenter
                        ? 'text-[#FFD54F] bg-[#1A1A1A]' 
                        : 'text-[#F5F5F5] hover:bg-[#1A1A1A]/60'
                    }`}
                  >
                    Educator Center
                  </Link>
                )}
                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                    isChat
                      ? 'text-[#FFD54F] bg-[#1A1A1A]' 
                      : 'text-[#F5F5F5] hover:bg-[#1A1A1A]/60'
                  }`}
                >
                  Chat
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <UserSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};
