'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutUser } from '@/app/actions/auth';
import MobileMenu from './MobileMenu';
import { User, ChevronDown, LogOut, LayoutDashboard, UserCircle, Shield } from 'lucide-react';

interface HeaderProps {
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    role: 'user' | 'admin';
  } | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname === path || pathname.startsWith(path);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/competitions', label: 'Competitions' },
    { href: '/practice', label: 'Practice' },
  ];

  return (
    <>
    <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-border-default/60">
      <div className="relative h-16 w-full px-4 sm:px-6 lg:px-8">
        {/* Logo - Absolute Left */}
        <div className="absolute left-4 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 max-w-[calc(100%-72px)] lg:max-w-none">
          <Link href="https://thenodersptnk.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
            <span className="text-lg sm:text-2xl lg:text-[1.65rem] leading-none font-brand text-white whitespace-nowrap">
              The Noders <span className="text-primary-blue">Community</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation - Absolutely Centered */}
        <nav className="hidden lg:flex items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-label="Main navigation">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 group ${
                      active ? 'text-text-primary' : 'text-text-tertiary hover:text-text-primary'
                    }`}
                  >
                    {link.label}
                    <span
                      className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-brand transition-transform duration-300 origin-left ${
                        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </nav>

        {/* Desktop Actions - Absolute Right */}
        <div className="hidden lg:flex items-center gap-2 absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={async () => {
                    await logoutUser();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium bg-gradient-brand text-white rounded-lg hover:shadow-lg hover:shadow-primary-blue/30 transition-all duration-300"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

        {/* Mobile Menu Button - Absolute Right */}
        <button
          className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors absolute right-4 top-1/2 -translate-y-1/2"
          onClick={() => setShowMobileMenu(true)}
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </header>

    {/* Mobile Menu — must live outside <header>: its backdrop-blur creates a
        containing block that would trap the menu's fixed positioning */}
    <MobileMenu
      isOpen={showMobileMenu}
      onClose={() => setShowMobileMenu(false)}
      user={user}
      navLinks={navLinks}
      onLogout={logoutUser}
    />
    </>
  );
};

export default Header;
