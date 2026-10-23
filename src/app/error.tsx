'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/Button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="band">
      <div className="shell pb-20 pt-14 sm:pb-24 sm:pt-20">
        <p className="eyebrow mb-4">Error</p>
        <h1 className="h-page max-w-[760px] text-balance">Something went wrong</h1>
        <p className="mt-4 max-w-[560px] text-base text-navy-text sm:text-lg">
          Please try again. If the problem persists, contact{' '}
          <a href="mailto:phuckhangtdn@gmail.com" className="band-link underline">
            phuckhangtdn@gmail.com
          </a>
          {error.digest ? ' with the code below.' : '.'}
        </p>
        {error.digest && <p className="mt-3 font-mono text-sm text-[#9FB1D6]">Code: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className={buttonClasses({ variant: 'primary', size: 'lg' })}>
            Try again
          </button>
          <Link href="/" className={buttonClasses({ variant: 'outline', size: 'lg', className: 'border-white/30' })}>
            Go home
          </Link>
        </div>
      </div>
    </section>
  );
}
