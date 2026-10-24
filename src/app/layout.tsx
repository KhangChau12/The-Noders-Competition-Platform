import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, JetBrains_Mono, Shrikhand } from 'next/font/google';
import { Suspense } from 'react';
import HeaderWithAuth from '@/components/layout/HeaderWithAuth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import MotionProvider from '@/components/ui/MotionProvider';
import './globals.css';

// Body and UI text — same family as thenodersptnk.com, with Vietnamese glyphs
const sans = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

// Numbers, scores, codes
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

// The wordmark only
const brand = Shrikhand({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-brand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Noders Competition Platform',
  description:
    'The competition platform of The Noders, a student-led tech community at PTNK. Compete in AI contests, practise on open problems, and verify certificates.',
  keywords: ['AI', 'competition', 'machine learning', 'data science', 'The Noders', 'PTNK'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0D0F14',
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${brand.variable}`}>
      <body className="font-sans bg-bg-primary text-text-primary antialiased flex flex-col min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-text-primary focus:px-5 focus:py-3 focus:font-semibold focus:text-bg-primary"
        >
          Skip to main content
        </a>
        <MotionProvider />
        <ToastProvider>
          {/* The header shell paints immediately; the account area streams in once the session is read. */}
          <Suspense fallback={<Header user={null} invitations={0} adminPending={0} pending />}>
            <HeaderWithAuth />
          </Suspense>
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
