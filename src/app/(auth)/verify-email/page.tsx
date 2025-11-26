import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Mail, CheckCircle, ArrowLeft, RefreshCcw } from 'lucide-react';

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email || '';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full">
        <Card className="p-8 md:p-12 text-center relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand" />

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-brand rounded-full flex items-center justify-center shadow-2xl shadow-primary-blue/50">
                <Mail className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center border-4 border-bg-surface">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
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
          <Card className="p-6 bg-bg-elevated border-primary-blue/30 mb-8 max-w-xl mx-auto">
            <div className="flex gap-3 text-left">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <span className="text-xl">💡</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-warning">Didn't receive the email?</h3>
                <ul className="text-text-tertiary text-sm space-y-1">
                  <li>• Check your spam or junk mail folder</li>
                  <li>• Make sure you entered the correct email address</li>
                  <li>• Wait a few minutes, the email might be delayed</li>
                  <li>• Try resending the verification email (button below)</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button variant="outline" size="lg" className="gap-2">
                <ArrowLeft className="w-5 h-5" />
                Back to Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="lg" className="gap-2">
                <RefreshCcw className="w-5 h-5" />
                Resend Verification Email
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-sm text-text-tertiary">
            Need help?{' '}
            <a
              href="mailto:thenodersptnk@gmail.com"
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
