'use client';

import { usePathname } from 'next/navigation';

// Dims the neural network background on all pages except the landing page,
// so content (text, cards) reads clearly without competing with the animation.
export default function ContentPageOverlay() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10"
      style={{ background: 'rgba(15, 23, 42, 0.72)' }}
    />
  );
}
