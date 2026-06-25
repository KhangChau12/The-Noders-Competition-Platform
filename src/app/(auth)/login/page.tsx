'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signIn } from './actions';
import { Trophy, Users, Zap } from 'lucide-react';

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
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden items-center justify-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-[#0f1f3d] to-bg-primary" />

        {/* Glow orbs */}
        <div className="absolute top-[-10%] right-[10%] w-[350px] h-[350px] bg-primary-blue/25 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[5%] w-[300px] h-[300px] bg-accent-cyan/20 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-[40%] left-[30%] w-[200px] h-[200px] bg-primary-blue/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />
        {/* Radial fade on grid */}
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,#000_40%,transparent_100%)] bg-transparent pointer-events-none" />

        {/* Constellation */}
        <div className="relative w-[78%] h-[430px] flex items-center justify-center select-none pointer-events-none z-10">
          {/* Center — Dashboard */}
          <div className="w-[66%] z-20 animate-levitate shadow-2xl shadow-primary-blue/20 rounded-xl border border-white/10 overflow-hidden bg-bg-surface/80 backdrop-blur-md">
            <img src="/hero-images/dashboard.png" alt="Dashboard" className="w-full h-auto object-contain" />
          </div>

          {/* Feature 1 — top left, lifted higher */}
          <div className="absolute top-[0%] left-[0%] w-[37%] z-10 animate-levitate [animation-delay:1.5s] shadow-xl shadow-black/40 rounded-lg border border-white/10 overflow-hidden bg-bg-surface">
            <img src="/hero-images/feature-1.png" alt="Feature 1" className="w-full h-auto object-contain" />
          </div>

          {/* Feature 2 — bottom right */}
          <div className="absolute bottom-[0%] right-[0%] w-[31%] z-30 animate-levitate [animation-delay:2.5s] shadow-xl shadow-black/40 rounded-lg border border-white/10 overflow-hidden bg-bg-surface">
            <img src="/hero-images/feature-2.png" alt="Feature 2" className="w-full h-auto object-contain" />
          </div>

          {/* Feature 3 — top right */}
          <div className="absolute top-[2%] right-[0%] w-[25%] z-30 animate-levitate [animation-delay:0.5s] shadow-lg rounded-lg border border-white/5 overflow-hidden bg-bg-surface">
            <img src="/hero-images/feature-3.png" alt="Feature 3" className="w-full h-auto object-contain" />
          </div>

          {/* Feature 4 — bottom left, pushed lower */}
          <div className="absolute bottom-[0%] left-[0%] w-[27%] z-10 animate-levitate [animation-delay:3.5s] shadow-lg rounded-lg border border-white/5 overflow-hidden bg-bg-surface">
            <img src="/hero-images/feature-4.png" alt="Feature 4" className="w-full h-auto object-contain" />
          </div>
        </div>

        {/* Bottom info strip */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-8 py-5 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-text-tertiary">
              <Trophy className="w-3.5 h-3.5 text-primary-blue" />
              <span className="text-xs">AI Competitions</span>
            </div>
            <div className="w-px h-3 bg-border-subtle" />
            <div className="flex items-center gap-1.5 text-text-tertiary">
              <Zap className="w-3.5 h-3.5 text-accent-cyan" />
              <span className="text-xs">Auto Scoring</span>
            </div>
            <div className="w-px h-3 bg-border-subtle" />
            <div className="flex items-center gap-1.5 text-text-tertiary">
              <Users className="w-3.5 h-3.5 text-success" />
              <span className="text-xs">Team Support</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-text-disabled tracking-widest uppercase">thenodersptnk.com</span>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-border-default to-transparent flex-shrink-0" />

      {/* Right panel — form */}
      <div className="flex-1 lg:w-2/5 flex flex-col items-center justify-center px-8 py-10 bg-bg-primary">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="font-brand text-2xl gradient-text">
              The Noders
            </Link>
          </div>

          {/* Header above card */}
          <div className="text-center mb-6">
            <h1 className="font-brand text-2xl sm:text-3xl mb-1.5 gradient-text leading-tight">
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

          <Card className="relative p-5 shadow-xl overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="flex items-center justify-end text-sm">
                <Link
                  href="/reset-password"
                  className="text-text-tertiary hover:text-primary-blue transition-colors text-xs"
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
          </Card>

          <p className="text-sm text-text-secondary text-center mt-5">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-primary-blue hover:text-accent-cyan transition-colors font-bold"
            >
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
