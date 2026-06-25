'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  BookOpen,
  Award,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  label: string;
  href: string;
  Icon: typeof LayoutDashboard;
  /** When true, only matches the exact path (so child routes don't keep it active) */
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', Icon: LayoutDashboard, exact: true },
  { label: 'Competitions', href: '/admin/competitions', Icon: Trophy },
  { label: 'Practice', href: '/admin/practice', Icon: BookOpen },
  { label: 'Certificates', href: '/admin/certificates', Icon: Award },
];

interface AdminSidebarProps {
  /** Number of pending registrations — shown as a badge on Dashboard */
  pendingCount?: number;
}

function useActivePath() {
  const pathname = usePathname();
  return (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/') || pathname.startsWith(item.href);
}

/** Shared nav body, rendered both in the desktop rail and the mobile drawer. */
function NavList({
  pendingCount,
  onNavigate,
}: {
  pendingCount?: number;
  onNavigate?: () => void;
}) {
  const isActive = useActivePath();

  return (
    <nav className="flex-1 p-3 space-y-1" aria-label="Admin navigation">
      <p className="px-3 mb-2 text-[10px] font-bold text-text-disabled uppercase tracking-[0.18em]">
        Admin
      </p>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        const showBadge = item.label === 'Dashboard' && (pendingCount ?? 0) > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-primary-blue/10 text-primary-blue border-l-2 border-primary-blue'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated border-l-2 border-transparent'
            )}
          >
            <item.Icon className={cn('w-5 h-5 shrink-0', active ? 'text-primary-blue' : 'text-text-tertiary')} />
            <span className="flex-1">{item.label}</span>
            {showBadge && (
              <span className="shrink-0 min-w-[20px] text-center text-[11px] font-bold text-warning bg-warning/15 px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function BackToSite({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="p-3 border-t border-border-default">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Site
      </Link>
    </div>
  );
}

export default function AdminSidebar({ pendingCount }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Drawer enter/exit animation (same approach as MobileMenu)
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
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close the drawer when the route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const currentLabel =
    NAV_ITEMS.find((i) => (i.exact ? pathname === i.href : pathname.startsWith(i.href)))?.label ?? 'Admin';

  return (
    <>
      {/* Desktop: fixed rail under the sticky header (h-16 = top-16) */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 bg-bg-surface border-r border-border-default lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]">
        <NavList pendingCount={pendingCount} />
        <BackToSite />
      </aside>

      {/* Mobile: thin trigger bar */}
      <div className="lg:hidden sticky top-16 z-30 flex items-center gap-3 px-4 h-12 bg-bg-surface/90 backdrop-blur-md border-b border-border-default">
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open admin menu"
          className="flex items-center justify-center w-9 h-9 -ml-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-text-primary">{currentLabel}</span>
        {(pendingCount ?? 0) > 0 && (
          <span className="ml-auto text-[11px] font-bold text-warning bg-warning/15 px-2 py-0.5 rounded-full">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Mobile: sliding drawer */}
      {isVisible && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setIsOpen(false)}
            className={cn(
              'absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300',
              isAnimating ? 'opacity-100' : 'opacity-0'
            )}
          />
          <aside
            className={cn(
              'absolute top-0 left-0 h-full w-[280px] max-w-[85vw] bg-bg-primary flex flex-col border-r border-border-default/60 transition-transform duration-300 ease-out',
              isAnimating ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-border-default/60 shrink-0">
              <span className="font-brand text-base text-text-primary">
                Admin <span className="text-primary-blue">Panel</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close admin menu"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList pendingCount={pendingCount} onNavigate={() => setIsOpen(false)} />
            </div>
            <BackToSite onNavigate={() => setIsOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
