'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';
import { isActivePath, type HeaderUser, type NavItem } from './Header';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: HeaderUser | null;
  nav: NavItem[];
  inAdmin: boolean;
  invitations: number;
  onLogout: () => Promise<void> | void;
}

// Colour per main section — the same meaning colours used across the site.
const TONE: Record<string, { bg: string; text: string }> = {
  '/competitions': { bg: 'bg-violet-bg', text: 'text-violet' },
  '/practice': { bg: 'bg-teal-bg', text: 'text-teal' },
  '/teams': { bg: 'bg-amber-bg', text: 'text-amber' },
};

export default function MobileMenu({ isOpen, onClose, user, nav, inAdmin, invitations, onLogout }: MobileMenuProps) {
  const pathname = usePathname() ?? '/';

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'You';

  return (
    <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex animate-fade-up flex-col overflow-y-auto bg-bg-primary lg:hidden">
      <div className="shell flex min-h-[64px] items-center justify-between border-b border-border-default">
        <Link href={inAdmin ? '/admin/dashboard' : '/'} onClick={onClose} className="flex items-baseline gap-2.5 text-text-primary">
          <span className="font-brand text-[21px] leading-none">The Noders</span>
          <span className={cn('text-[13px] font-semibold', inAdmin ? 'text-amber-soft' : 'text-blue')}>{inAdmin ? 'Admin' : 'Platform'}</span>
        </Link>
        <button type="button" onClick={onClose} aria-label="Close menu" className="-mr-2.5 inline-flex h-11 w-11 items-center justify-center text-text-primary">
          <X className="h-6 w-6" aria-hidden />
        </button>
      </div>

      <div className="shell flex flex-1 flex-col gap-4 py-4">
        <nav aria-label={inAdmin ? 'Admin' : 'Main'} className="flex flex-col gap-2">
          {nav.map((item, i) => {
            const tone = TONE[item.href];
            const active = isActivePath(pathname, item.href);
            const badge = item.href === '/teams' && invitations > 0 ? `${invitations} invitation${invitations > 1 ? 's' : ''}` : item.badge ? `${item.badge} pending` : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                style={{ animationDelay: `${60 + i * 50}ms` }}
                className={cn(
                  'flex min-h-[56px] animate-fade-up items-center justify-between rounded-2xl px-4 text-lg font-semibold text-text-primary transition-transform active:scale-[0.98]',
                  tone ? tone.bg : 'bg-bg-surface',
                  active && 'ring-1 ring-inset ring-white/20'
                )}
              >
                {item.label}
                {badge && <span className={cn('text-[13px] font-semibold', tone ? tone.text : 'text-violet')}>{badge}</span>}
              </Link>
            );
          })}
        </nav>

        {user ? (
          <div className="rounded-2xl bg-bg-surface p-2">
            <div className="flex items-center gap-3 px-2.5 pb-2.5 pt-1.5">
              <Avatar name={displayName} src={user.avatar_url} size={40} />
              <div className="min-w-0 leading-tight">
                <div className="truncate font-semibold">{displayName}</div>
                <div className="truncate text-[13px] text-text-muted">{user.email}</div>
              </div>
            </div>
            <SheetLink href="/dashboard" onClick={onClose}>Dashboard</SheetLink>
            <SheetLink href="/profile" onClick={onClose}>Profile</SheetLink>
            {user.role === 'admin' && (
              <SheetLink href={inAdmin ? '/dashboard' : '/admin/dashboard'} onClick={onClose}>
                {inAdmin ? 'Back to my dashboard' : 'Admin panel'}
              </SheetLink>
            )}
            <SheetLink href="/verify" onClick={onClose}>Verify certificate</SheetLink>
            <SheetLink href="https://thenodersptnk.com" external onClick={onClose}>thenodersptnk.com ↗</SheetLink>
          </div>
        ) : (
          <div className="rounded-2xl bg-bg-surface p-2">
            <SheetLink href="/verify" onClick={onClose}>Verify certificate</SheetLink>
            <SheetLink href="/guide" onClick={onClose}>How it works</SheetLink>
            <SheetLink href="https://thenodersptnk.com" external onClick={onClose}>thenodersptnk.com ↗</SheetLink>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2.5 pt-2">
          {user ? (
            <button
              type="button"
              onClick={async () => {
                onClose();
                await onLogout();
              }}
              className="min-h-[48px] rounded-lg border border-border-subtle font-semibold text-text-tertiary"
            >
              Sign out
            </button>
          ) : (
            <>
              <Link href="/signup" onClick={onClose} className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-text-primary font-semibold text-bg-primary">
                Create account
              </Link>
              <Link href="/login" onClick={onClose} className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-border-subtle font-semibold text-text-primary">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SheetLink({ href, children, onClick, external }: { href: string; children: React.ReactNode; onClick: () => void; external?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex min-h-[46px] items-center rounded-lg px-2.5 text-[15px] text-text-secondary hover:bg-white/[0.05] hover:text-white"
    >
      {children}
    </Link>
  );
}
