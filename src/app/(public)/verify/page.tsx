'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Award, Search, ArrowRight, ShieldCheck } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Please enter a verification code');
      return;
    }

    // Navigate to verify result page
    router.push(`/verify/${trimmedCode}`);
  };

  return (
    <div className="min-h-screen px-4 py-16 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-brand text-3xl sm:text-4xl mb-3 gradient-text">
            Verify Certificate
          </h1>
          <p className="text-text-secondary">
            Enter the verification code printed on your certificate to verify its authenticity
          </p>
        </div>

        {/* Verify Form */}
        <Card className="relative overflow-hidden p-6">
          <ShieldCheck
            className="absolute -top-8 -right-8 h-32 w-32 text-accent-cyan/[0.08] rotate-[12deg] pointer-events-none select-none [filter:drop-shadow(0_0_20px_rgba(6,182,212,0.35))]"
            aria-hidden="true"
          />
          <form onSubmit={handleSubmit} className="relative space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="e.g., PAIC-2026-X7K9"
                className="w-full px-3 sm:px-4 py-4 bg-bg-elevated border border-border-default rounded-lg text-center text-lg sm:text-xl font-mono uppercase tracking-wider focus:outline-none focus:border-primary-blue"
                autoFocus
              />
              {error && (
                <p className="text-sm text-error mt-2">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              <Search className="w-5 h-5 mr-2" />
              Verify Certificate
            </Button>
          </form>
        </Card>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-text-tertiary">
          <p className="mb-2">
            The verification code can be found on the certificate,
            usually at the bottom or in the corner.
          </p>
          <p>
            Format: <code className="text-accent-cyan">PREFIX-XXXX</code>
          </p>
        </div>
      </div>
    </div>
  );
}
