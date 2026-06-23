import Link from 'next/link';
import { Globe, Mail } from 'lucide-react';

const LinkDot = () => (
  <span className="w-1.5 h-1.5 rounded-full bg-primary-blue/30 group-hover:bg-primary-blue transition-colors"></span>
);

export default function Footer() {
  return (
    <footer className="border-t border-border-default bg-gradient-to-b from-bg-surface to-bg-elevated px-4 sm:px-6 lg:px-8 py-12 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="font-brand text-2xl gradient-text mb-3">
              The Noders Platform
            </h3>
            <p className="text-sm text-text-tertiary leading-relaxed mb-4 max-w-md">
              The official AI competition platform of The Noders Community — for data scientists and
              ML practitioners to compete, practice, and grow.
            </p>
            <div className="flex gap-3">
              <a
                href="https://thenodersptnk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-bg-surface border border-border-default hover:border-primary-blue hover:bg-primary-blue/10 flex items-center justify-center transition-all group"
                title="Official Website"
              >
                <Globe className="w-4 h-4 text-text-secondary group-hover:text-primary-blue transition-colors" />
              </a>
              <a
                href="mailto:phuckhangtdn@gmail.com"
                className="w-9 h-9 rounded-lg bg-bg-surface border border-border-default hover:border-primary-blue hover:bg-primary-blue/10 flex items-center justify-center transition-all group"
                title="Contact Founder"
              >
                <Mail className="w-4 h-4 text-text-secondary group-hover:text-primary-blue transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-semibold text-text-primary mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-text-secondary hover:text-primary-blue transition-colors text-sm font-medium flex items-center gap-2 group">
                  <LinkDot />
                  Home
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="text-text-secondary hover:text-primary-blue transition-colors text-sm font-medium flex items-center gap-2 group">
                  <LinkDot />
                  Competitions
                </Link>
              </li>
              <li>
                <Link href="/practice" className="text-text-secondary hover:text-primary-blue transition-colors text-sm font-medium flex items-center gap-2 group">
                  <LinkDot />
                  Practice
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-text-secondary hover:text-primary-blue transition-colors text-sm font-medium flex items-center gap-2 group">
                  <LinkDot />
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-base font-semibold text-text-primary mb-4">Resources</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/verify" className="text-text-secondary hover:text-primary-blue transition-colors text-sm font-medium flex items-center gap-2 group">
                  <LinkDot />
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-text-secondary hover:text-primary-blue transition-colors text-sm font-medium flex items-center gap-2 group">
                  <LinkDot />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-text-secondary hover:text-primary-blue transition-colors text-sm font-medium flex items-center gap-2 group">
                  <LinkDot />
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-tertiary text-sm text-center sm:text-left">
            &copy; {new Date().getFullYear()}{' '}
            <span className="font-semibold text-text-secondary">The Noders Platform</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-text-tertiary hover:text-text-secondary text-sm transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-text-tertiary hover:text-text-secondary text-sm transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
