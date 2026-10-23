'use client';

import { useEffect } from 'react';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Site-wide motion helpers, mounted once in the root layout:
 *
 * 1. Scroll reveal: elements marked `data-reveal` (or `data-reveal-group`,
 *    whose children stagger) fade up the first time they enter the viewport.
 *    Anything already on screen is shown immediately, so nothing flickers on
 *    load, and without JS everything is simply visible.
 * 2. Smooth in-page anchors: clicks on `href="#id"` links glide to the target
 *    (respecting its scroll-margin) instead of jumping.
 */
export default function MotionProvider() {
  useEffect(() => {
    if (reduced() || !('IntersectionObserver' in window)) return;
    const SEL = '[data-reveal], [data-reveal-group]';

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.dataset.shown = '';
          io.unobserve(el);
          window.setTimeout(() => (el.dataset.done = ''), 1100);
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    );

    // Anything already on screen is shown at once (no flicker); the rest waits for the observer.
    const take = (el: HTMLElement) => {
      if (el.dataset.shown !== undefined || el.dataset.revealSeen) return;
      el.dataset.revealSeen = '1';
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        el.dataset.shown = '';
        el.dataset.done = '';
      } else io.observe(el);
    };
    const scan = (node: ParentNode) => {
      if (node instanceof HTMLElement && node.matches(SEL)) take(node);
      node.querySelectorAll<HTMLElement>(SEL).forEach(take);
    };

    scan(document);
    document.documentElement.classList.add('reveal-ready');

    // Streamed / client-rendered content arrives later: pick it up as it is inserted.
    const mo = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => n instanceof HTMLElement && scan(n));
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = decodeURIComponent(a.getAttribute('href')!.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
