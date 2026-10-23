'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';
import MobileMenu from './MobileMenu';

export interface HeaderUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
}

interface HeaderProps {
  user: HeaderUser | null;
  /** Pending team invitations for this user. */
  invitations: number;
  /** Pending registrations (admins only). */
  adminPending: number;
}

export interface NavItem {
  href: string;
  label: string;
  badge?: number;
}

export function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function Header({ user, invitations, adminPending }: HeaderProps) {
  const pathname = usePathname() ?? '/';
  const inAdmin = pathname.startsWith('/admin');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on navigation, outside click and Escape.
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const nav: NavItem[] = inAdmin
    ? [
        { href: '/admin/dashboard', label: 'Overview', badge: adminPending },
        { href: '/admin/competitions', label: 'Competitions' },
        { href: '/admin/practice', label: 'Practice' },
        { href: '/admin/certificates', label: 'Certificates' },
      ]
    : [
        { href: '/competitions', label: 'Competitions' },
        { href: '/practice', label: 'Practice' },
        ...(user ? [{ href: '/teams', label: 'Teams' }] : []),
      ];

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'You';
  const hasNews = invitations > 0;

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-white/[0.08] bg-bg-primary/80 backdrop-blur-xl backdrop-saturate-150">
        <header className="shell flex min-h-[64px] items-center gap-6 lg:min-h-[68px] lg:gap-11">
          {/* Wordmark */}
          <Link href={inAdmin ? '/admin/dashboard' : '/'} className="flex shrink-0 items-baseline gap-2.5 text-text-primary">
            <span className="font-brand text-[21px] leading-none lg:text-[23px]">The Noders</span>
            <span className={cn('text-[13px] font-semibold', inAdmin ? 'text-amber-soft' : 'text-blue')}>
              {inAdmin ? 'Admin' : 'Platform'}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label={inAdmin ? 'Admin' : 'Main'} className="hidden flex-1 items-center gap-7 text-[15px] font-medium lg:flex">
            {nav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-[44px] items-center gap-2 underline-offset-[10px] decoration-2',
                    active
                      ? cn('text-white underline', inAdmin ? 'decoration-amber' : 'decoration-blue')
                      : 'text-text-tertiary hover:text-text-primary'
                  )}
                >
                  {item.label}
                  {!!item.badge && (
                    <span className="rounded-full bg-violet px-1.5 text-[11px] font-bold leading-[18px] text-violet-ink no-underline">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop right side */}
          <div className="ml-auto hidden items-center gap-6 text-[15px] font-medium lg:flex">
            {inAdmin ? (
              <Link href="/" className="text-text-tertiary hover:text-text-primary">
                View site ↗
              </Link>
            ) : (
              <Link
                href="/verify"
                className={cn(isActivePath(pathname, '/verify') ? 'text-white' : 'text-text-tertiary hover:text-text-primary')}
              >
                Verify certificate
              </Link>
            )}

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex min-h-[44px] items-center gap-2.5 text-text-primary"
                >
                  <span className="relative">
                    <Avatar name={displayName} src={user.avatar_url} size={32} />
                    {hasNews && (
                      <span
                        aria-label={`${invitations} team invitation${invitations > 1 ? 's' : ''}`}
                        className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber ring-2 ring-bg-primary"
                      />
                    )}
                  </span>
                  <span className="max-w-[160px] truncate">{displayName}</span>
                  <ChevronDown className={cn('h-3.5 w-3.5 text-text-muted transition-transform', menuOpen && 'rotate-180')} aria-hidden />
                </button>

                {menuOpen && (
                  <div role="menu" className="absolute right-0 top-[52px] w-[290px] origin-top-right animate-pop-in rounded-2xl border border-border-default bg-bg-surface p-2 shadow-pop">
                    <div className="px-3 pb-3 pt-2">
                      <div className="truncate font-semibold">{displayName}</div>
                      <div className="truncate text-[13px] text-text-muted">{user.email}</div>
                    </div>
                    {hasNews && (
                      <Link
                        role="menuitem"
                        href="/teams"
                        className="mb-1.5 flex flex-col rounded-xl bg-amber-bg px-3 py-2.5 hover:bg-amber-strong"
                      >
                        <span className="text-xs font-semibold text-amber">
                          {invitations === 1 ? 'Team invitation' : `${invitations} team invitations`}
                        </span>
                        <span className="text-text-primary">Answer on the Teams page</span>
                      </Link>
                    )}
                    <MenuLink href="/dashboard">Dashboard</MenuLink>
                    <MenuLink href="/teams">My teams</MenuLink>
                    <MenuLink href="/profile">Profile</MenuLink>
                    <div className="my-1.5 border-t border-border-default" />
                    {user.role === 'admin' && (
                      <MenuLink href={inAdmin ? '/dashboard' : '/admin/dashboard'}>
                        {inAdmin ? 'Back to my dashboard' : 'Admin panel'}
                      </MenuLink>
                    )}
                    <MenuLink href="https://thenodersptnk.com" external>
                      thenodersptnk.com ↗
                    </MenuLink>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={async () => {
                        setMenuOpen(false);
                        await logoutUser();
                      }}
                      className="flex min-h-[40px] w-full items-center rounded-lg px-3 text-left text-[15px] text-text-muted hover:bg-white/[0.05] hover:text-text-primary"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link href="/login" className="inline-flex min-h-[42px] items-center px-2 text-text-primary">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-[42px] items-center rounded-lg bg-text-primary px-4 font-semibold text-bg-primary hover:bg-white"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>

          {/* Phone / tablet: menu button */}
          <button
            type="button"
            className="relative -mr-2.5 ml-auto inline-flex h-11 w-11 items-center justify-center text-text-primary lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-6 w-6" aria-hidden />
            {hasNews && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-amber ring-2 ring-bg-primary" />}
          </button>
        </header>
      </div>

      {/* Must live outside the blurred bar: backdrop-filter traps fixed children */}
      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        nav={nav}
        inAdmin={inAdmin}
        invitations={invitations}
        onLogout={logoutUser}
      />
    </>
  );
}

function MenuLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  return (
    <Link
      role="menuitem"
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex min-h-[40px] items-center rounded-lg px-3 text-[15px] text-text-secondary hover:bg-white/[0.05] hover:text-white"
    >
      {children}
    </Link>
  );
}
