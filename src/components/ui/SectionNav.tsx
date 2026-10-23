'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SectionLink {
  id: string;
  label: string;
}

const GAP = 20; // space between the bars and the section heading after a jump

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Bottom edge of everything stuck to the top of the viewport (site header + this bar). */
function stickyBottom(nav: HTMLElement | null): number {
  const bar = nav?.closest('[data-sticky-bar]') as HTMLElement | null;
  return bar ? bar.getBoundingClientRect().bottom : 120;
}

/**
 * In-page tabs for the sticky bar on contest / practice pages.
 * Clicking glides to the section heading (not a jump), the tab for the section
 * in view is highlighted, and an underline slides between tabs.
 */
export default function SectionNav({ items, className }: { items: SectionLink[]; className?: string }) {
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [active, setActive] = useState<string | null>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  const lockUntil = useRef(0); // ignore scroll-spy while a click-scroll is running

  const go = useCallback((id: string) => {
    const section = document.getElementById(id);
    if (!section) return;
    // Finish any pending scroll-reveal first so the measured position is final.
    section.dataset.shown = '';
    section.dataset.done = '';
    const target = (section.querySelector('h2, h3') as HTMLElement | null) ?? section;
    const y = target.getBoundingClientRect().top + window.scrollY - stickyBottom(navRef.current) - GAP;
    const smooth = !prefersReducedMotion();
    lockUntil.current = Date.now() + (smooth ? 900 : 0);
    setActive(id);
    window.scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' });
    history.replaceState(null, '', `#${id}`);
  }, []);

  // Arriving with a hash (e.g. /competitions/x#problem): land at the right offset.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id && items.some((i) => i.id === id)) requestAnimationFrame(() => go(id));
  }, [go, items]);

  // Scroll-spy: the active section is the last one whose top has passed under the bars.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      if (Date.now() < lockUntil.current) return;
      const line = stickyBottom(navRef.current) + GAP + 40;
      let current: string | null = null;
      let currentTop = -Infinity;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        // Sections laid out side by side share a top: keep the first of them.
        if (top <= line && top > currentTop + 8) {
          current = id;
          currentTop = top;
        }
      }
      // At the very bottom, the last section wins even if it is short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = items[items.length - 1]?.id ?? current;
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items]);

  // Slide the underline to the active tab and keep it visible in the scrollable row.
  useLayoutEffect(() => {
    const el = active ? linkRefs.current[active] : null;
    if (!el) return setBar(null);
    setBar({ left: el.offsetLeft, width: el.offsetWidth });
    const nav = navRef.current;
    if (nav && (el.offsetLeft < nav.scrollLeft || el.offsetLeft + el.offsetWidth > nav.scrollLeft + nav.clientWidth)) {
      nav.scrollTo({ left: el.offsetLeft - 16, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }, [active]);

  return (
    <nav ref={navRef} aria-label="On this page" className={cn('scrollbar-none relative -mx-1 flex min-w-0 flex-1 gap-5 overflow-x-auto px-1 text-[15px] font-medium', className)}>
      {items.map(({ id, label }) => (
        <a
          key={id}
          ref={(el) => {
            linkRefs.current[id] = el;
          }}
          href={`#${id}`}
          aria-current={active === id ? 'location' : undefined}
          onClick={(e) => {
            e.preventDefault();
            go(id);
          }}
          className={cn('whitespace-nowrap py-3.5 transition-colors duration-200', active === id ? 'text-white' : 'text-text-tertiary hover:text-white')}
        >
          {label}
        </a>
      ))}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-white transition-[transform,width,opacity] duration-300 ease-out"
        style={{ width: bar?.width ?? 0, transform: `translateX(${bar?.left ?? 0}px)`, opacity: bar ? 1 : 0, left: 0 }}
      />
    </nav>
  );
}
