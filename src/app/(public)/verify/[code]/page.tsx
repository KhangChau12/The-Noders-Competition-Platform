import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldX,
  Award,
  Calendar,
  User,
  Trophy,
  Download,
  ArrowLeft,
} from 'lucide-react';

interface Props {
  params: { code: string };
}

export default async function VerifyResultPage({ params }: Props) {
  const { code } = params;
  const supabase = await createClient();

  // Fetch certificate by verification code
  const { data: certificate } = await supabase
    .from('certificates')
    .select(`
      *,
      competitions (
        id,
        title
      )
    `)
    .eq('verification_code', code.toUpperCase())
    .single() as { data: any };

  // Get file URL if certificate exists
  let fileUrl: string | null = null;
  if (certificate) {
    const { data } = supabase.storage
      .from('certificates')
      .getPublicUrl(certificate.file_path);
    fileUrl = data.publicUrl;
  }

  // Certificate not found
  if (!certificate) {
    return (
      <div className="min-h-screen px-4 py-16 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error/20 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-error" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-error">
            Certificate Not Found
          </h1>
          <p className="text-text-secondary mb-6">
            No certificate was found with the verification code:
          </p>
          <code className="block text-xl font-mono text-text-tertiary mb-8 p-4 bg-bg-elevated rounded-lg">
            {code.toUpperCase()}
          </code>
          <p className="text-sm text-text-tertiary mb-6">
            Please check the code and try again. Make sure you've entered it correctly,
            including any dashes.
          </p>
          <Link href="/verify">
            <Button variant="primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isImage = ['png', 'jpg', 'jpeg'].includes(certificate.file_type);
  const isPdf = certificate.file_type === 'pdf';

  // Certificate found - show details with embedded preview
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-success">
            Certificate Verified
          </h1>
          <p className="text-text-secondary text-sm">
            This certificate is authentic and was issued by The Noders PTNK
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Certificate Preview - Main Area */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-border-default bg-bg-tertiary flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">Certificate Preview</span>
                <a
                  href={fileUrl || '#'}
                  download={`${certificate.verification_code}.${certificate.file_type}`}
                >
                  <Button variant="primary" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </a>
              </div>

              {/* Embedded Preview */}
              <div className="bg-bg-elevated">
                {isPdf && fileUrl && (
                  <iframe
                    src={`${fileUrl}#toolbar=0&navpanes=0`}
                    className="w-full border-0"
                    style={{ height: '600px' }}
                    title="Certificate PDF"
                  />
                )}
                {isImage && fileUrl && (
                  <div className="p-4 flex items-center justify-center" style={{ minHeight: '400px' }}>
                    <img
                      src={fileUrl}
                      alt={`Certificate for ${certificate.recipient_name}`}
                      className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Certificate Details - Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Verification Status */}
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-warning" />
                <div>
                  <Badge variant="success" className="mb-1">Verified</Badge>
                  <div className="font-mono text-sm text-accent-cyan">
                    {certificate.verification_code}
                  </div>
                </div>
              </div>
            </Card>

            {/* Details */}
            <Card className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <div className="text-xs text-text-tertiary">Recipient</div>
                  <div className="font-semibold">{certificate.recipient_name}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-blue/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-primary-blue" />
                </div>
                <div>
                  <div className="text-xs text-text-tertiary">Competition</div>
                  <div className="font-medium text-sm">
                    {certificate.competitions?.title || 'Unknown Competition'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-accent-cyan" />
                </div>
                <div>
                  <div className="text-xs text-text-tertiary">Issue Date</div>
                  <div className="font-medium text-sm">
                    {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Download Button for mobile */}
            <a
              href={fileUrl || '#'}
              download={`${certificate.verification_code}.${certificate.file_type}`}
              className="block lg:hidden"
            >
              <Button variant="primary" size="lg" className="w-full">
                <Download className="w-5 h-5 mr-2" />
                Download Certificate
              </Button>
            </a>

            {/* Back Link */}
            <div className="pt-2">
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary"
              >
                <ArrowLeft className="w-4 h-4" />
                Verify another certificate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
