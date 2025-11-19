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
            Kiểm Tra Email Của Bạn
          </h1>

          {/* Message */}
          <div className="text-text-secondary text-lg mb-6 max-w-xl mx-auto leading-relaxed">
            Chúng tôi đã gửi một email xác nhận đến
            {email && (
              <div className="mt-2 mb-2">
                <span className="inline-block px-4 py-2 bg-bg-elevated rounded-lg font-mono text-primary-blue font-semibold">
                  {email}
                </span>
              </div>
            )}
            Vui lòng kiểm tra hộp thư đến và nhấn vào link xác nhận để kích hoạt tài khoản của bạn.
          </div>

          {/* Divider */}
          <div className="my-8 h-px bg-border-default" />

          {/* Instructions */}
          <div className="text-left max-w-xl mx-auto mb-8">
            <h2 className="text-xl font-bold mb-4 text-center">Các Bước Tiếp Theo</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Mở email của bạn</h3>
                  <p className="text-text-tertiary text-sm">
                    Kiểm tra hộp thư đến (hoặc thư mục spam/junk nếu không thấy)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Nhấn vào link xác nhận</h3>
                  <p className="text-text-tertiary text-sm">
                    Tìm email từ The Noders và nhấn vào nút "Xác Nhận Email"
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-blue/20 flex items-center justify-center text-primary-blue font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Bắt đầu tham gia</h3>
                  <p className="text-text-tertiary text-sm">
                    Sau khi xác nhận, bạn có thể đăng nhập và tham gia các cuộc thi
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
                <h3 className="font-semibold mb-2 text-warning">Không nhận được email?</h3>
                <ul className="text-text-tertiary text-sm space-y-1">
                  <li>• Kiểm tra thư mục spam hoặc junk mail</li>
                  <li>• Đảm bảo bạn đã nhập đúng địa chỉ email</li>
                  <li>• Chờ vài phút, email có thể bị trễ</li>
                  <li>• Thử gửi lại email xác nhận (nút bên dưới)</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button variant="outline" size="lg" className="gap-2">
                <ArrowLeft className="w-5 h-5" />
                Quay lại đăng nhập
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="lg" className="gap-2">
                <RefreshCcw className="w-5 h-5" />
                Gửi lại email xác nhận
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-sm text-text-tertiary">
            Cần hỗ trợ?{' '}
            <a
              href="mailto:thenodersptnk@gmail.com"
              className="text-primary-blue hover:underline font-semibold"
            >
              Liên hệ với chúng tôi
            </a>
          </div>

          {/* Background decoration */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-blue/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-text-tertiary">
          <p>Link xác nhận sẽ hết hạn sau 24 giờ vì lý do bảo mật</p>
        </div>
      </div>
    </div>
  );
}
