import Link from 'next/link';
import { buttonClasses } from '@/components/ui/Button';

export const metadata = { title: 'Page not found – The Noders Platform' };

export default function NotFound() {
  return (
    <section className="band">
      <div className="shell flex flex-col gap-10 pb-20 pt-14 sm:pb-24 sm:pt-20 lg:flex-row lg:items-center lg:gap-16">
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-4">404</p>
          <h1 className="h-page text-balance">Page not found</h1>
          <p className="mt-4 max-w-[560px] text-base text-navy-text sm:text-lg">The page may have been moved or removed.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/competitions" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
              Competitions
            </Link>
            <Link href="/practice" className={buttonClasses({ variant: 'outline', size: 'lg', className: 'border-white/30' })}>
              Practice
            </Link>
            <Link href="/" className={buttonClasses({ variant: 'ghost', size: 'lg', className: 'text-navy-text' })}>
              Home
            </Link>
          </div>
        </div>
        <span aria-hidden className="select-none font-brand text-[7rem] leading-none text-white/[0.08] sm:text-[10rem] lg:text-[13rem]">
          404
        </span>
      </div>
    </section>
  );
}
