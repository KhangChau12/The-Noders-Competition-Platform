'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signIn } from './actions';
import { Trophy } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setError(message);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    if (redirectTo) {
      formData.append('redirect', redirectTo);
    }

    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg-primary">
      {/* Left panel — hero constellation (desktop only) */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden items-center justify-center bg-gradient-to-br from-bg-primary via-bg-surface/60 to-bg-primary">
        {/* Glow orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-primary-blue/20 rounded-full blur-[100px] pointer-events-none opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-accent-cyan/20 rounded-full blur-[100px] pointer-events-none opacity-60" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(51,65,85,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(51,65,85,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

        {/* Branding */}
        <div className="absolute top-8 left-8 z-20">
          <Link href="/" className="font-brand text-xl gradient-text">
            The Noders
          </Link>
        </div>

        {/* Constellation — fully contained, no negative offsets */}
        <div className="relative w-[75%] h-[420px] flex items-center justify-center select-none pointer-events-none z-10">
          {/* Center — Dashboard */}
          <div className="w-[68%] z-20 animate-levitate shadow-2xl shadow-primary-blue/10 rounded-xl border border-white/10 overflow-hidden bg-bg-surface/80 backdrop-blur-md">
            <img src="/hero-images/dashboard.png" alt="Dashboard" className="w-full h-auto object-contain" />
          </div>
          {/* Feature 1 — top left */}
          <div className="absolute top-[2%] left-[2%] w-[36%] z-10 animate-levitate [animation-delay:1.5s] shadow-xl shadow-black/40 rounded-lg border border-white/10 overflow-hidden bg-bg-surface">
            <img src="/hero-images/feature-1.png" alt="Feature 1" className="w-full h-auto object-contain" />
          </div>
          {/* Feature 2 — bottom right */}
          <div className="absolute bottom-[2%] right-[2%] w-[30%] z-30 animate-levitate [animation-delay:2.5s] shadow-xl shadow-black/40 rounded-lg border border-white/10 overflow-hidden bg-bg-surface">
            <img src="/hero-images/feature-2.png" alt="Feature 2" className="w-full h-auto object-contain" />
          </div>
          {/* Feature 3 — top right */}
          <div className="absolute top-[2%] right-[2%] w-[24%] z-30 animate-levitate [animation-delay:0.5s] shadow-lg rounded-lg border border-white/5 overflow-hidden bg-bg-surface">
            <img src="/hero-images/feature-3.png" alt="Feature 3" className="w-full h-auto object-contain" />
          </div>
          {/* Feature 4 — bottom left */}
          <div className="absolute bottom-[2%] left-[2%] w-[26%] z-10 animate-levitate [animation-delay:3.5s] shadow-lg rounded-lg border border-white/5 overflow-hidden bg-bg-surface">
            <img src="/hero-images/feature-4.png" alt="Feature 4" className="w-full h-auto object-contain" />
          </div>
        </div>

        {/* Tagline */}
        <div className="absolute bottom-8 left-0 right-0 text-center z-20">
          <p className="text-xs text-text-tertiary tracking-widest uppercase">Competition Platform</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 lg:w-2/5 flex items-center justify-center px-6 py-10 bg-gradient-to-br from-bg-primary via-bg-surface/30 to-bg-primary lg:bg-none lg:bg-bg-primary">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="font-brand text-2xl gradient-text">
              The Noders
            </Link>
          </div>

          <Card className="relative p-5 shadow-2xl overflow-hidden">
            <Trophy
              className="absolute -top-8 -right-8 h-28 w-28 text-primary-blue/[0.06] rotate-[12deg] pointer-events-none select-none [filter:drop-shadow(0_0_20px_rgba(37,99,235,0.3))]"
              aria-hidden="true"
            />
            <div className="relative text-center mb-6">
              <h1 className="font-brand text-2xl sm:text-3xl mb-2 gradient-text leading-tight">
                Welcome Back
              </h1>
              <p className="text-sm text-text-secondary">
                Sign in to continue competing
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error rounded-lg text-error text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-1.5 text-text-primary">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-1.5 text-text-primary">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/reset-password"
                  className="text-primary-blue hover:text-accent-cyan transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isLoading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-border-default text-center">
              <p className="text-sm text-text-secondary">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="text-primary-blue hover:text-accent-cyan transition-colors font-bold"
                >
                  Sign up now
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
