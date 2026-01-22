import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import CertificatesList from './CertificatesList';
import {
  Award,
  Plus,
  ArrowLeft,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface Props {
  params: { competitionId: string };
}

export default async function CompetitionCertificatesPage({ params }: Props) {
  const { competitionId } = params;
  const supabase = await createClient();

  // Check authentication and admin role
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch competition
  const { data: competition } = await supabase
    .from('competitions')
    .select('id, title')
    .eq('id', competitionId)
    .is('deleted_at', null)
    .single() as { data: { id: string; title: string } | null };

  if (!competition) {
    notFound();
  }

  // Fetch certificates for this competition
  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      *,
      users:issued_by (
        full_name,
        email
      )
    `)
    .eq('competition_id', competitionId)
    .order('created_at', { ascending: false });

  // Fetch prefix
  const { data: prefixData } = await supabase
    .from('certificate_prefixes')
    .select('prefix')
    .eq('competition_id', competitionId)
    .single() as { data: { prefix: string } | null };

  const prefix = prefixData?.prefix || null;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/certificates"
            className="inline-flex items-center gap-2 text-text-tertiary hover:text-text-secondary mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Certificates
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-brand text-3xl sm:text-4xl mb-2 gradient-text">
                {competition.title}
              </h1>
              <div className="flex items-center gap-4 text-text-secondary">
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {certificates?.length || 0} certificates
                </span>
                {prefix && (
                  <Badge variant="tech" className="font-mono">
                    Prefix: {prefix}
                  </Badge>
                )}
              </div>
            </div>
            <Link href={`/admin/certificates/upload?competition=${competitionId}`}>
              <Button variant="primary" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Upload Certificate
              </Button>
            </Link>
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-4 mb-6 bg-bg-tertiary/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-text-tertiary">
              <ExternalLink className="w-4 h-4" />
              <span>Verify Link:</span>
              <code className="px-2 py-1 bg-bg-elevated rounded font-mono text-accent-cyan">
                {typeof window !== 'undefined' ? window.location.origin : ''}/verify
              </code>
            </div>
            <div className="text-text-tertiary">
              People can verify certificates at this link by entering the verification code
            </div>
          </div>
        </Card>

        {/* Certificates List */}
        <CertificatesList
          certificates={certificates || []}
          competitionId={competitionId}
        />
      </div>
    </div>
  );
}
