'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Small "i" dot that explains something on hover (mouse), Enter/Space
 * (keyboard) or tap (phones). Tap again, click outside or press Escape to close.
 */
export default function InfoTip({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const viaMouse = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className={cn('group relative inline-flex align-middle', className)} onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)} onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}>
      {/* 24px dot inside a 44px touch target */}
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        // Mouse: hover already opened it, so a click keeps it open. Tap / Enter / Space toggle.
        onPointerDown={(e) => (viaMouse.current = e.pointerType === 'mouse')}
        onClick={() => {
          const mouse = viaMouse.current; // read before reset: the state updater runs later
          viaMouse.current = false;
          setOpen((o) => (mouse ? true : !o));
        }}
        onBlur={() => setOpen(false)}
        className="-m-1.5 inline-flex h-11 w-11 items-center justify-center rounded-full"
      >
        <span
          aria-hidden
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[13px] font-semibold leading-none transition-colors',
            open ? 'border-blue bg-blue-bg text-blue' : 'border-border-subtle text-text-tertiary group-hover:border-blue group-hover:text-blue'
          )}
        >
          i
        </span>
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-full z-40 mt-2 w-[min(300px,calc(100vw-40px))] -translate-x-1/2 animate-pop-in rounded-xl border border-border-default bg-bg-elevated px-4 py-3 text-left text-sm font-normal leading-relaxed tracking-normal text-text-secondary shadow-pop"
        >
          {children}
        </span>
      )}
    </span>
  );
}
