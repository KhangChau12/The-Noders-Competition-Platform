'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { signUp } from './actions';
import { validatePassword } from '@/lib/utils/validation';

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

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordErrors(passwordValidation.errors);
      setError(passwordValidation.errors.join('. '));
      setIsLoading(false);
      return;
    }

    // Check passwords match
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
      // Redirect to verify-email page with email as query param
      router.push(`/verify-email?email=${encodeURIComponent(result.email || '')}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-bg-primary via-bg-surface to-bg-primary">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-brand mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="font-bold text-3xl mb-2 text-text-primary">
            Tham gia ngay
          </h1>
          <p className="text-text-secondary">
            Tạo tài khoản để bắt đầu thi đấu
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg text-success text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold mb-2 text-text-primary">
              Họ và tên
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              required
              disabled={isLoading || !!success}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2 text-text-primary">
              Địa chỉ Email
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
            <label htmlFor="password" className="block text-sm font-semibold mb-2 text-text-primary">
              Mật khẩu
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              required
              disabled={isLoading || !!success}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 text-text-primary">
              Xác nhận mật khẩu
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu"
              required
              disabled={isLoading || !!success}
            />
          </div>

          {!success && (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              loading={isLoading}
            >
              Tạo tài khoản
            </Button>
          )}

          {success && (
            <Link href="/login">
              <Button variant="primary" size="lg" className="w-full mt-6">
                Đến trang đăng nhập
              </Button>
            </Link>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-border-default text-center">
          <p className="text-sm text-text-secondary">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              className="text-primary-blue hover:text-accent-cyan transition-colors font-bold"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
