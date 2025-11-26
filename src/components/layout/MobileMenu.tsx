'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className="fixed inset-y-0 right-0 w-full max-w-sm bg-bg-surface border-l border-border-default z-50 lg:hidden transform transition-transform duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
            <span className="text-xl font-display bg-gradient-brand bg-clip-text text-transparent">
              Menu
            </span>
            <button
              onClick={onClose}
              className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-6 py-4 bg-bg-elevated border-b border-border-default">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center text-white font-semibold text-lg">
                  {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">
                    {user.full_name || user.email.split('@')[0]}
                  </p>
                  <p className="text-sm text-text-tertiary">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-6 py-4" aria-label="Mobile navigation">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    block px-4 py-3 rounded-lg font-semibold transition-colors
                    ${
                      isActive(link.href)
                        ? 'bg-primary-blue/10 text-primary-blue'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                    }
                  `}
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* User Menu Items */}
            {user && (
              <>
                <div className="my-4 border-t border-border-default" />
                <div className="space-y-2">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated font-semibold transition-colors"
                    onClick={onClose}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated font-semibold transition-colors"
                    onClick={onClose}
                  >
                    Profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin/dashboard"
                      className="block px-4 py-3 rounded-lg text-primary-blue hover:bg-primary-blue/10 font-semibold transition-colors"
                      onClick={onClose}
                    >
                      Admin
                    </Link>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* Bottom Actions */}
          <div className="px-6 py-4 border-t border-border-default">
            {user ? (
              <button
                onClick={() => {
                  onClose();
                  onLogout?.();
                }}
                className="w-full px-6 py-3 font-semibold text-white bg-error rounded-lg hover:bg-error/90 transition-colors"
              >
                Logout
              </button>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full px-6 py-3 font-semibold text-center text-text-primary bg-bg-elevated border border-border-default rounded-lg hover:border-primary-blue hover:bg-primary-blue/10 transition-all"
                  onClick={onClose}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block w-full px-6 py-3 font-semibold text-center text-white bg-gradient-brand rounded-lg hover:shadow-lg hover:shadow-primary-blue/30 transition-all"
                  onClick={onClose}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
