import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import UploadCertificateForm from './UploadCertificateForm';
import { ArrowLeft, Award } from 'lucide-react';

interface Props {
  searchParams: { competition?: string };
}

export default async function UploadCertificatePage({ searchParams }: Props) {
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

  // Fetch all competitions
  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, title')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Fetch existing prefixes
  const { data: prefixes } = await supabase
    .from('certificate_prefixes')
    .select('competition_id, prefix');

  const prefixMap: Record<string, string> = {};
  prefixes?.forEach((p: any) => {
    prefixMap[p.competition_id] = p.prefix;
  });

  // Pre-selected competition from query param
  const selectedCompetitionId = searchParams.competition || null;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/certificates"
            className="inline-flex items-center gap-2 text-text-tertiary hover:text-text-secondary mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Certificates
          </Link>

          <h1 className="font-brand text-3xl sm:text-4xl mb-2 gradient-text flex items-center gap-3">
            <Award className="w-8 h-8" />
            Upload Certificate
          </h1>
          <p className="text-text-secondary">
            Upload a PDF or image certificate and get a verification code
          </p>
        </div>

        <Card className="p-6">
          <UploadCertificateForm
            competitions={competitions || []}
            prefixMap={prefixMap}
            selectedCompetitionId={selectedCompetitionId}
            userId={user.id}
          />
        </Card>
      </div>
    </div>
  );
}
