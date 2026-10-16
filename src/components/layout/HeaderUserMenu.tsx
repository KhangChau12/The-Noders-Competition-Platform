'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { logoutUser } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { LogOut, LayoutDashboard, Shield, ChevronDown } from 'lucide-react';
import { HeaderUserSkeleton } from './HeaderUserSkeleton';

export interface HeaderUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
}

export interface HeaderUserMenuProps {
  user?: HeaderUser | null;
  initialUser?: HeaderUser | null;
}

export { HeaderUserSkeleton };

export default function HeaderUserMenu({ user: propUser, initialUser }: HeaderUserMenuProps) {
  const [user, setUser] = useState<HeaderUser | null | undefined>(propUser ?? initialUser);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    }
  }, [propUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function syncUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setUser(null);
          return;
        }

        const { data: profile } = (await supabase
          .from('users')
          .select('id, email, full_name, avatar_url, role')
          .eq('id', authUser.id)
          .single()) as { data: any };

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name || undefined,
            avatar_url: profile.avatar_url || undefined,
            role: profile.role as 'user' | 'admin',
          });
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email!,
            full_name: authUser.user_metadata?.full_name || undefined,
            avatar_url: authUser.user_metadata?.avatar_url || undefined,
            role: 'user',
          });
        }
      } catch (err) {
        console.error('Failed to sync user auth:', err);
      }
    }

    if (user === undefined) {
      syncUser();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
      } else if (session?.user) {
        await syncUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show skeleton while auth state is resolving on the client
  if (user === undefined) {
    return <HeaderUserSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
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
      </div>
    );
  }

  const displayName = user.full_name || user.email.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={userMenuRef}>
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors duration-200 group"
      >
        {/* Avatar initials placeholder */}
        <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-semibold">
          {initials}
        </div>
        <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
      </button>

      {showUserMenu && (
        <div className="absolute top-full right-0 mt-2 w-52 py-1.5 bg-bg-surface/95 backdrop-blur-md border border-border-default rounded-xl shadow-xl z-50">
          <div className="px-4 py-2 border-b border-border-default/60 mb-1">
            <p className="text-xs font-medium text-text-primary truncate">{displayName}</p>
            <p className="text-xs text-text-tertiary truncate">{user.email}</p>
          </div>
          <Link
            href="/dashboard"
            onClick={() => setShowUserMenu(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Dashboard
          </Link>
          {user.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
            >
              <Shield className="w-4 h-4 shrink-0" />
              Admin Panel
            </Link>
          )}
          <div className="border-t border-border-default/60 mt-1 pt-1">
            <button
              onClick={async () => {
                setShowUserMenu(false);
                await logoutUser();
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-tertiary hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
