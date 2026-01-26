import Link from 'next/link';
import { Globe, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border-default bg-gradient-to-b from-bg-surface to-bg-elevated px-6 py-12 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 mb-10">
          {/* Brand */}
          <div>
            <h3 className="font-shrikhand text-2xl gradient-text mb-3">
              The Noders
            </h3>
            <p className="text-sm text-text-tertiary leading-relaxed mb-4">
              The Noders Competition Platform - Official AI competition platform of The Noders PTNK club for data scientists and ML practitioners.
            </p>
            <div className="flex gap-3">
              <a href="https://thenodersptnk.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-bg-surface border border-border-default hover:border-primary-blue hover:bg-primary-blue/10 flex items-center justify-center transition-all group" title="Official Website">
                <Globe className="w-4 h-4 text-text-secondary group-hover:text-primary-blue transition-colors" />
              </a>
              <a href="mailto:thenodersptnk@gmail.com" className="w-9 h-9 rounded-lg bg-bg-surface border border-border-default hover:border-primary-blue hover:bg-primary-blue/10 flex items-center justify-center transition-all group" title="Contact Email">
                <Mail className="w-4 h-4 text-text-secondary group-hover:text-primary-blue transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-semibold text-text-primary mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/"
                  className="text-text-secondary hover:text-primary-blue transition-colors text-sm font-medium flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-blue/30 group-hover:bg-primary-blue transition-colors"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/competitions"
                  className="text-text-secondary hover:text-primary-blue transition-colors text-sm font-medium flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-blue/30 group-hover:bg-primary-blue transition-colors"></span>
                  Competitions
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-text-secondary hover:text-primary-blue transition-colors text-sm font-medium flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-blue/30 group-hover:bg-primary-blue transition-colors"></span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-text-secondary hover:text-primary-blue transition-colors text-sm font-medium flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-blue/30 group-hover:bg-primary-blue transition-colors"></span>
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-border-default">
          <p className="text-text-tertiary text-sm text-center">
            &copy; {new Date().getFullYear()} <span className="font-semibold text-text-secondary">The Noders PTNK</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
