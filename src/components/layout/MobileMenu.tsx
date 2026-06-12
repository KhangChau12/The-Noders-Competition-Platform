'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, BookOpen, LayoutDashboard, User, Shield, LogOut, X } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    role: 'user' | 'admin';
  } | null;
  navLinks: Array<{ href: string; label: string }>;
  onLogout?: () => void;
}

const NAV_ICON_MAP: Record<string, React.ReactNode> = {
  Home: <Home className="w-5 h-5" />,
  Competitions: <Trophy className="w-5 h-5" />,
  Practice: <BookOpen className="w-5 h-5" />,
};

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, user, navLinks, onLogout }) => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      const timeout = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timeout);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path);

  if (!isVisible) return null;

  const initials = user
    ? (user.full_name?.[0] || user.email[0]).toUpperCase()
    : null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Side panel */}
      <div
        className={`absolute top-0 right-0 h-full w-[300px] max-w-[90vw] bg-bg-primary flex flex-col transition-transform duration-300 ease-out border-l border-border-default/60 ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border-default/60 shrink-0">
          <span className="font-brand text-base text-text-primary">
            The Noders <span className="text-primary-blue">Community</span>
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* User card */}
          {user ? (
            <div className="px-4 pt-5 pb-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-surface border border-border-default/40">
                <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-text-primary truncate">
                    {user.full_name || user.email.split('@')[0]}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                </div>
                {user.role === 'admin' && (
                  <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wider text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 pt-5 pb-2" />
          )}

          {/* Main nav */}
          <nav className="px-3 pb-2" aria-label="Mobile navigation">
            <p className="px-3 mb-2 text-[10px] font-bold text-text-disabled uppercase tracking-[0.18em]">
              Navigate
            </p>
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-3 mb-0.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary-blue bg-primary-blue/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                  }`}
                >
                  <span className={active ? 'text-primary-blue' : 'text-text-tertiary'}>
                    {NAV_ICON_MAP[link.label] ?? null}
                  </span>
                  {link.label}
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-blue" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Account nav (logged-in only) */}
          {user && (
            <nav className="px-3 pt-3 border-t border-border-default/40" aria-label="Account navigation">
              <p className="px-3 mb-2 text-[10px] font-bold text-text-disabled uppercase tracking-[0.18em]">
                Account
              </p>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-3 mb-0.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors"
              >
                <LayoutDashboard className="w-5 h-5 text-text-tertiary" />
                Dashboard
              </Link>
              <Link
                href="/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-3 mb-0.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors"
              >
                <User className="w-5 h-5 text-text-tertiary" />
                Profile
              </Link>
              {user.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 mb-0.5 rounded-xl text-sm font-medium text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  Admin Panel
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Bottom CTA */}
        <div
          className="px-4 py-4 border-t border-border-default/60 shrink-0"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          {user ? (
            <button
              onClick={() => { onClose(); onLogout?.(); }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-error border border-error/30 bg-error/5 hover:bg-error/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <div className="space-y-2.5">
              <Link
                href="/login"
                onClick={onClose}
                className="block w-full px-4 py-3 text-center text-sm rounded-xl font-semibold text-text-primary bg-bg-surface border border-border-default hover:bg-bg-elevated transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="block w-full px-4 py-3 text-center text-sm rounded-xl font-semibold text-white bg-gradient-brand shadow-lg shadow-primary-blue/20"
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
