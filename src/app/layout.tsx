import type { Metadata } from 'next';
import { Nunito, Inter, JetBrains_Mono } from 'next/font/google';
import HeaderWithAuth from '@/components/layout/HeaderWithAuth';
import Footer from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import NeuralNetworkBackground from '@/components/ui/NeuralNetworkBackground';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Noders Competition Platform',
  description: 'Official AI & ML competition platform by The Noders PTNK - Compete in challenges, test your skills, and climb the leaderboard',
  keywords: ['AI', 'competition', 'machine learning', 'data science', 'The Noders PTNK'],
};

// Force dynamic rendering to prevent caching issues with auth
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${nunito.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-bg-primary text-text-primary antialiased flex flex-col min-h-screen">
        {/* Neural Network Background - Global */}
        <NeuralNetworkBackground />

        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-gradient-brand focus:text-white focus:px-6 focus:py-3 focus:rounded-xl focus:font-semibold focus:shadow-lg focus:shadow-primary-blue/50 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-bg-primary"
        >
          Skip to main content
        </a>
        <ToastProvider>
          <HeaderWithAuth />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
