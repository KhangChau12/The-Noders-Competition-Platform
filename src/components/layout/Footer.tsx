'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean; dot?: string }[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Competitions', href: '/competitions', dot: 'bg-violet' },
      { label: 'Practice', href: '/practice', dot: 'bg-teal' },
      { label: 'Teams', href: '/teams', dot: 'bg-amber' },
      { label: 'Dashboard', href: '/dashboard', dot: 'bg-blue' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'How it works', href: '/guide' },
      { label: 'Verify certificate', href: '/verify' },
      { label: 'Contact', href: 'mailto:phuckhangtdn@gmail.com', external: true },
    ],
  },
];

export default function Footer() {
  const pathname = usePathname() ?? '/';
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="band overflow-hidden">
      <div className="shell pt-14 sm:pt-[72px]">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 pb-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-16">
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <p className="max-w-[360px] text-[15px] text-navy-text">
              The competition platform of The Noders, a student-led tech community at High School for the Gifted VNUHCM (PTNK).
            </p>
            <a href="https://thenodersptnk.com" target="_blank" rel="noopener noreferrer" className="band-link w-fit text-[15px] font-semibold">
              thenodersptnk.com ↗
            </a>
            <a href="https://facebook.com/thenodersptnk" target="_blank" rel="noopener noreferrer" className="band-link w-fit text-[15px] font-semibold">
              facebook.com/thenodersptnk ↗
            </a>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-3.5 text-sm font-semibold text-white">{col.title}</h2>
              <ul className="flex flex-col gap-2.5 text-[15px]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} className="band-link">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="band-link inline-flex items-center gap-2">
                        {l.dot && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${l.dot}`} />}
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div
          aria-hidden
          className="-mb-[0.12em] -ml-[0.03em] whitespace-nowrap font-brand text-[clamp(64px,15vw,210px)] leading-[0.8] text-[rgba(5,12,30,0.28)]"
        >
          The Noders
        </div>
      </div>
      <div className="bg-navy-deep">
        <div className="shell flex flex-wrap justify-between gap-3 py-4 text-[13px] text-navy-text">
          <span>© {new Date().getFullYear()} The Noders Community · Built by members</span>
          <span className="flex gap-5">
            <Link href="/privacy" className="band-link">
              Privacy
            </Link>
            <Link href="/terms" className="band-link">
              Terms
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
