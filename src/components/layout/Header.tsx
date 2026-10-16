'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutUser } from '@/app/actions/auth';
import MobileMenu from './MobileMenu';
import HeaderUserMenu, { HeaderUserSkeleton, type HeaderUser } from './HeaderUserMenu';
import { Trophy, BookOpen, Users } from 'lucide-react';

interface HeaderProps {
  user?: HeaderUser | null;
}

const NAV_ICON_MAP: Record<string, React.ReactNode> = {
  Competitions: <Trophy className="w-4 h-4" />,
  Practice: <BookOpen className="w-4 h-4" />,
  'Our Community': <Users className="w-4 h-4" />,
};

const Header: React.FC<HeaderProps> = ({ user }) => {
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path);
  };

  const navLinks = [
    { href: '/competitions', label: 'Competitions' },
    { href: '/practice', label: 'Practice' },
    { href: 'https://thenodersptnk.com', label: 'Our Community', external: true },
  ];

  return (
    <>
    <header className="sticky top-0 z-40 bg-bg-primary/70 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
      <div className="relative h-16 w-full px-4 sm:px-6 lg:px-12">
        {/* Logo - Absolute Left */}
        <div className="absolute left-4 sm:left-6 lg:left-12 top-1/2 -translate-y-1/2 max-w-[calc(100%-72px)] lg:max-w-none">
          <Link href="/" className="flex items-center">
            <span className="text-lg sm:text-2xl lg:text-[1.65rem] leading-none font-brand text-white whitespace-nowrap">
              The Noders <span className="text-primary-blue">Platform</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation - Absolutely Centered */}
        <nav className="hidden lg:flex items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-label="Main navigation">
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = !link.external && isActive(link.href);
              const icon = NAV_ICON_MAP[link.label];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors duration-200 group ${
                    active ? 'text-text-primary' : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  {icon && (
                    <span className={`shrink-0 transition-colors duration-200 ${active ? 'text-primary-blue' : 'text-text-tertiary group-hover:text-text-secondary'}`}>
                      {icon}
                    </span>
                  )}
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
        <div className="hidden lg:flex items-center gap-2 absolute right-4 sm:right-6 lg:right-12 top-1/2 -translate-y-1/2">
          <Suspense fallback={<HeaderUserSkeleton />}>
            <HeaderUserMenu user={user} />
          </Suspense>
        </div>

        {/* Mobile Menu Button - Absolute Right */}
        <button
          className="lg:hidden flex items-center justify-center w-11 h-11 -mr-2 text-text-secondary hover:text-text-primary transition-colors absolute right-4 top-1/2 -translate-y-1/2"
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
