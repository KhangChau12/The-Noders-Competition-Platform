import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Mail, ArrowLeft, RefreshCcw } from 'lucide-react';

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email || '';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full">
        <Card className="p-6 sm:p-8 md:p-12 text-center relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand" />

          {/* Watermark icon */}
          <Mail
            className="absolute -top-8 -right-8 h-44 w-44 text-primary-blue/[0.07] rotate-[12deg] pointer-events-none select-none [filter:drop-shadow(0_0_28px_rgba(37,99,235,0.35))]"
            aria-hidden="true"
          />

          {/* Heading */}
          <h1 className="relative font-brand text-3xl md:text-4xl gradient-text mb-4 mt-2">
            Check Your Email
          </h1>

          {/* Message */}
          <div className="text-text-secondary text-lg mb-6 max-w-xl mx-auto leading-relaxed">
            We've sent a confirmation email to
            {email && (
              <div className="mt-2 mb-2">
                <span className="inline-block px-4 py-2 bg-bg-elevated rounded-lg font-mono text-primary-blue font-semibold">
                  {email}
                </span>
              </div>
            )}
            Please check your inbox and click the confirmation link to activate your account.
          </div>

          {/* Divider */}
          <div className="my-8 h-px bg-border-default" />

          {/* Instructions */}
          <div className="text-left max-w-xl mx-auto mb-8">
            <h2 className="text-xl font-bold mb-4 text-center">Next Steps</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Open your email</h3>
                  <p className="text-text-tertiary text-sm">
                    Check your inbox (or spam/junk folder if you don't see it)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Click the confirmation link</h3>
                  <p className="text-text-tertiary text-sm">
                    Find the email from The Noders and click "Verify Email" button
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Start competing</h3>
                  <p className="text-text-tertiary text-sm">
                    After verification, you can log in and join competitions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-5 sm:p-6 rounded-xl bg-warning/5 border border-warning/20 mb-8 max-w-xl mx-auto text-left">
            <h3 className="font-semibold mb-2 text-warning">Didn't receive the email?</h3>
            <ul className="text-text-tertiary text-sm space-y-1">
              <li>&bull; Check your spam or junk mail folder</li>
              <li>&bull; Make sure you entered the correct email address</li>
              <li>&bull; Wait a few minutes, the email might be delayed</li>
              <li>&bull; Try resending the verification email (button below)</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/login" className="block">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                <ArrowLeft className="w-5 h-5" />
                Back to Login
              </Button>
            </Link>
            <Link href="/signup" className="block">
              <Button variant="primary" size="lg" className="gap-2 w-full sm:w-auto">
                <RefreshCcw className="w-5 h-5" />
                Resend Verification Email
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-sm text-text-tertiary">
            Need help?{' '}
            <a
              href="mailto:phuckhangtdn@gmail.com"
              className="text-primary-blue hover:underline font-semibold"
            >
              Contact us
            </a>
          </div>

          {/* Background decoration */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-blue/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-text-tertiary">
          <p>The verification link will expire after 24 hours for security reasons</p>
        </div>
      </div>
    </div>
  );
}
