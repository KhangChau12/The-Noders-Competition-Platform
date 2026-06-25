'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signUp } from './actions';
import { validatePassword } from '@/lib/utils/validation';
import { Rocket } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordErrors(passwordValidation.errors);
      setError(passwordValidation.errors.join('. '));
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      router.push(`/verify-email?email=${encodeURIComponent(result.email || '')}`);
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
            <Rocket
              className="absolute -top-8 -right-8 h-28 w-28 text-accent-cyan/[0.06] rotate-[12deg] pointer-events-none select-none [filter:drop-shadow(0_0_20px_rgba(6,182,212,0.3))]"
              aria-hidden="true"
            />
            <div className="relative text-center mb-6">
              <h1 className="font-brand text-2xl sm:text-3xl mb-2 gradient-text leading-tight">
                Join Now
              </h1>
              <p className="text-sm text-text-secondary">
                Create an account to start competing
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error rounded-lg text-error text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-success/10 border border-success rounded-lg text-success text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold mb-1.5 text-text-primary">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  required
                  disabled={isLoading || !!success}
                />
              </div>

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
                  disabled={isLoading || !!success}
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
                  placeholder="Minimum 6 characters"
                  required
                  disabled={isLoading || !!success}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-1.5 text-text-primary">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  required
                  disabled={isLoading || !!success}
                />
              </div>

              {!success && (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-4"
                  loading={isLoading}
                >
                  Create Account
                </Button>
              )}

              {success && (
                <Link href="/login">
                  <Button variant="primary" size="lg" className="w-full mt-4">
                    Go to Login
                  </Button>
                </Link>
              )}
            </form>

            <div className="mt-5 pt-5 border-t border-border-default text-center">
              <p className="text-sm text-text-secondary">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-primary-blue hover:text-accent-cyan transition-colors font-bold"
                >
                  Sign in now
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
