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

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  const navLinks = [
    { href: '/competitions', label: 'Competitions' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-bg-surface/90 backdrop-blur-xl border-b border-border-default/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="group">
            {/* Logo Text - Single Line */}
            <span className="text-xl font-display font-extrabold leading-none bg-gradient-brand bg-clip-text text-transparent group-hover:opacity-80 transition-opacity duration-300">
              The Noders Competition Platform
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-bg-elevated rounded-full p-1.5" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-6 py-2 font-semibold text-sm rounded-full transition-all duration-300 ${
                  isActive(link.href)
                    ? 'text-white bg-gradient-brand shadow-lg shadow-primary-blue/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                }`}
              >
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                {/* User Menu Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-bg-elevated to-bg-surface border border-border-default hover:border-primary-blue hover:shadow-lg hover:shadow-primary-blue/20 transition-all duration-300 group"
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl group-hover:shadow-primary-blue/50 transition-all duration-300 ring-2 ring-bg-surface group-hover:ring-primary-blue/30">
                        {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-bg-surface shadow-sm animate-pulse"></div>
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-bold text-text-primary group-hover:text-primary-blue transition-colors">
                        {user.full_name || user.email.split('@')[0]}
                      </span>
                      <span className="text-xs font-medium text-text-tertiary flex items-center gap-1">
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3" />
                            <span>Admin</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3" />
                            <span>Member</span>
                          </>
                        )}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-text-tertiary group-hover:text-primary-blue transition-all duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-3 w-56 bg-bg-surface/95 backdrop-blur-xl border border-border-default/80 rounded-2xl shadow-2xl z-20 overflow-hidden animate-slideInDown">
                        <div className="py-2">
                          <div className="px-4 py-4 bg-gradient-to-br from-primary-blue/10 to-accent-cyan/10 border-b border-border-default">
                            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">Signed in as</p>
                            <p className="text-sm font-bold text-text-primary truncate">{user.email}</p>
                          </div>
                          <div className="my-2">
                            <Link
                              href="/dashboard"
                              className="flex items-center gap-3 mx-2 px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-primary-blue/10 hover:text-primary-blue rounded-lg transition-all duration-200 group"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary-blue/10 flex items-center justify-center group-hover:bg-primary-blue/20 transition-colors">
                                <LayoutDashboard className="w-4 h-4 text-primary-blue" />
                              </div>
                              <span>Dashboard</span>
                            </Link>
                            <Link
                              href="/profile"
                              className="flex items-center gap-3 mx-2 px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-primary-blue/10 hover:text-primary-blue rounded-lg transition-all duration-200 group"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary-blue/10 flex items-center justify-center group-hover:bg-primary-blue/20 transition-colors">
                                <UserCircle className="w-4 h-4 text-primary-blue" />
                              </div>
                              <span>Profile</span>
                            </Link>
                            {user.role === 'admin' && (
                              <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-3 mx-2 px-3 py-2.5 text-sm font-bold text-primary-blue hover:bg-gradient-brand/10 rounded-lg transition-all duration-200 group"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary-blue/50 transition-all">
                                  <Shield className="w-4 h-4 text-white" />
                                </div>
                                <span className="bg-gradient-brand bg-clip-text text-transparent">Admin</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={async () => {
                    await logoutUser();
                  }}
                  className="relative px-6 py-2.5 font-semibold text-sm text-error bg-error/10 border border-error/30 rounded-xl hover:bg-error hover:text-white hover:border-error hover:shadow-lg hover:shadow-error/30 transition-all duration-300 group overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </span>
                  <div className="absolute inset-0 bg-error opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="relative px-6 py-2.5 font-semibold text-sm text-text-primary bg-bg-elevated border border-border-default rounded-xl hover:border-primary-blue hover:text-primary-blue hover:bg-primary-blue/5 transition-all duration-300 group overflow-hidden"
                >
                  <span className="relative z-10">Login</span>
                  <div className="absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </Link>
                <Link
                  href="/signup"
                  className="relative px-6 py-2.5 font-bold text-sm text-white bg-gradient-brand rounded-xl hover:shadow-2xl hover:shadow-primary-blue/50 hover:-translate-y-1 transition-all duration-300 shadow-lg group overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>Sign Up</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
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
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        user={user}
        navLinks={navLinks}
        onLogout={logoutUser}
      />
    </header>
  );
};

export default Header;
