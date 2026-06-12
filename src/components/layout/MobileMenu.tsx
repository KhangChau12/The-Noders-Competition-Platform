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

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  user,
  navLinks,
  onLogout,
}) => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Mount/unmount with slide animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Double rAF so the panel mounts off-screen before transitioning in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      const timeout = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timeout);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path);
  };

  const getIcon = (label: string) => {
    switch (label) {
      case 'Home': return <Home className="w-5 h-5" />;
      case 'Competitions': return <Trophy className="w-5 h-5" />;
      case 'Practice': return <BookOpen className="w-5 h-5" />;
      default: return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Menu Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-[320px] max-w-[85vw] bg-bg-primary border-l border-border-default flex flex-col transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border-default shrink-0">
          <span className="font-brand text-lg text-text-primary">
            The Noders <span className="text-primary-blue">Community</span>
          </span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-surface transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* User info */}
          {user && (
            <div className="px-5 py-4 border-b border-border-default bg-bg-surface/60">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold shrink-0">
                  {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary truncate">
                    {user.full_name || user.email.split('@')[0]}
                  </p>
                  <p className="text-sm text-text-tertiary truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="px-3 py-4" aria-label="Mobile navigation">
            <p className="px-3 mb-2 text-xs font-bold text-text-disabled uppercase tracking-widest">
              Navigation
            </p>
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-3 mb-1 rounded-lg font-medium transition-colors ${
                    active
                      ? 'text-primary-blue bg-primary-blue/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                  }`}
                >
                  {getIcon(link.label)}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Account section */}
          {user && (
            <div className="px-3 py-4 border-t border-border-default">
              <p className="px-3 mb-2 text-xs font-bold text-text-disabled uppercase tracking-widest">
                Account
              </p>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-3 mb-1 rounded-lg font-medium text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-3 mb-1 rounded-lg font-medium text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              {user.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 mb-1 rounded-lg font-medium text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Bottom actions (pinned) */}
        <div className="px-5 py-4 border-t border-border-default shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {user ? (
            <button
              onClick={() => {
                onClose();
                onLogout?.();
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-semibold text-error border border-error/30 bg-error/10 hover:bg-error/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          ) : (
            <div className="space-y-3">
              <Link
                href="/login"
                onClick={onClose}
                className="block w-full px-4 py-3 text-center rounded-lg font-semibold text-text-primary bg-bg-surface border border-border-default hover:bg-bg-elevated transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="block w-full px-4 py-3 text-center rounded-lg font-semibold text-white bg-gradient-brand shadow-lg shadow-primary-blue/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
