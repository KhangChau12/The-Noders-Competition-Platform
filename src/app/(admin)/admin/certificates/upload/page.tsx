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

  // Admin role enforced by the admin layout. We still need the user id for the upload.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
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

          <h1 className="font-brand text-2xl sm:text-3xl lg:text-4xl mb-1.5 gradient-text leading-tight">
            Upload Certificate
          </h1>
          <p className="text-sm sm:text-base text-text-secondary">
            Upload a PDF or image certificate and get a verification code
          </p>
        </div>

        <Card className="hover:translate-y-0 hover:border-border-default p-5 sm:p-6">
          <UploadCertificateForm
            competitions={competitions || []}
            prefixMap={prefixMap}
            selectedCompetitionId={selectedCompetitionId}
            userId={user.id}
          />
        </Card>
    </div>
  );
}
