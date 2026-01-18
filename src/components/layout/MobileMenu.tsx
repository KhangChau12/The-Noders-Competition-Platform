'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Info, LayoutDashboard, User, Shield, LogOut, X } from 'lucide-react';

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

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path);
  };

  const getIcon = (label: string) => {
    switch (label) {
      case 'Home': return <Home className="w-5 h-5" />;
      case 'Competitions': return <Trophy className="w-5 h-5" />;
      case 'About': return <Info className="w-5 h-5" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 9998,
        }}
      />

      {/* Menu Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '320px',
          maxWidth: '85vw',
          height: '100vh',
          backgroundColor: '#0d1117',
          zIndex: 9999,
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            borderBottom: '1px solid #21262d',
            backgroundColor: '#0d1117',
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#22d3ee' }}>Menu</span>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '8px',
              color: '#8b949e',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div style={{ padding: '20px', borderBottom: '1px solid #21262d', backgroundColor: '#161b22' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  flexShrink: 0,
                }}
              >
                {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name || user.email.split('@')[0]}
                </p>
                <p style={{ fontSize: '14px', color: '#8b949e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ padding: '16px' }}>
          <p style={{ padding: '0 12px', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold', color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Navigation
          </p>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                marginBottom: '4px',
                borderRadius: '8px',
                fontWeight: 500,
                color: isActive(link.href) ? '#22d3ee' : '#c9d1d9',
                backgroundColor: isActive(link.href) ? 'rgba(34,211,238,0.1)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              {getIcon(link.label)}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Account Section */}
        {user && (
          <div style={{ padding: '16px', borderTop: '1px solid #21262d' }}>
            <p style={{ padding: '0 12px', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold', color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Account
            </p>
            <Link
              href="/dashboard"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                marginBottom: '4px',
                borderRadius: '8px',
                fontWeight: 500,
                color: '#c9d1d9',
                textDecoration: 'none',
              }}
            >
              <LayoutDashboard style={{ width: '20px', height: '20px' }} />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/profile"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                marginBottom: '4px',
                borderRadius: '8px',
                fontWeight: 500,
                color: '#c9d1d9',
                textDecoration: 'none',
              }}
            >
              <User style={{ width: '20px', height: '20px' }} />
              <span>Profile</span>
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin/dashboard"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  marginBottom: '4px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  color: '#22d3ee',
                  textDecoration: 'none',
                }}
              >
                <Shield style={{ width: '20px', height: '20px' }} />
                <span>Admin Panel</span>
              </Link>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div style={{ padding: '16px', borderTop: '1px solid #21262d', marginTop: '16px' }}>
          {user ? (
            <button
              onClick={() => {
                onClose();
                onLogout?.();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                color: 'white',
                backgroundColor: '#dc2626',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <LogOut style={{ width: '20px', height: '20px' }} />
              <span>Logout</span>
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px',
                  marginBottom: '12px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  fontWeight: 600,
                  color: 'white',
                  backgroundColor: '#21262d',
                  border: '1px solid #30363d',
                  textDecoration: 'none',
                }}
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  fontWeight: 600,
                  color: 'white',
                  background: 'linear-gradient(90deg, #22d3ee, #3b82f6)',
                  textDecoration: 'none',
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Spacer for bottom safe area on mobile */}
        <div style={{ height: '32px' }} />
      </div>
    </>
  );
};

export default MobileMenu;
