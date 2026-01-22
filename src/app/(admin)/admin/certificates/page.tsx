import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Award,
  Plus,
  ChevronRight,
} from 'lucide-react';

export default async function AdminCertificatesPage() {
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

  // Fetch all competitions with certificate counts
  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, title')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Fetch certificate counts per competition
  const { data: certificateCounts } = await supabase
    .from('certificates')
    .select('competition_id');

  // Build counts map
  const countsMap: Record<string, number> = {};
  certificateCounts?.forEach((cert: any) => {
    countsMap[cert.competition_id] = (countsMap[cert.competition_id] || 0) + 1;
  });

  // Fetch certificate prefixes
  const { data: prefixes } = await supabase
    .from('certificate_prefixes')
    .select('competition_id, prefix');

  const prefixMap: Record<string, string> = {};
  prefixes?.forEach((p: any) => {
    prefixMap[p.competition_id] = p.prefix;
  });

  // Combine data
  const competitionsWithCerts = competitions?.map((comp: any) => ({
    ...comp,
    certificateCount: countsMap[comp.id] || 0,
    prefix: prefixMap[comp.id] || null,
  }));

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-brand text-4xl sm:text-5xl mb-2 gradient-text">
              Certificate Management
            </h1>
            <p className="text-text-secondary">
              Upload and manage certificates for verification
            </p>
          </div>
          <Link href="/admin/certificates/upload">
            <Button variant="primary" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Upload Certificate
            </Button>
          </Link>
        </div>

        {/* Competitions List */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-border-default bg-bg-tertiary">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certificates by Competition
            </h2>
          </div>

          {competitionsWithCerts && competitionsWithCerts.length > 0 ? (
            <div className="divide-y divide-border-default">
              {competitionsWithCerts.map((competition: any) => (
                <Link
                  key={competition.id}
                  href={`/admin/certificates/${competition.id}`}
                  className="block"
                >
                  <div className="p-6 hover:bg-bg-tertiary/50 transition-colors flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{competition.title}</h3>
                        {competition.prefix && (
                          <Badge variant="tech" className="font-mono">
                            {competition.prefix}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          {competition.certificateCount} certificates
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {competition.certificateCount > 0 ? (
                        <Badge variant="success">{competition.certificateCount} uploaded</Badge>
                      ) : (
                        <Badge variant="secondary">No certificates</Badge>
                      )}
                      <ChevronRight className="w-5 h-5 text-text-tertiary" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-text-tertiary">
              <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No competitions yet</p>
              <p className="text-sm">Create a competition first to start uploading certificates</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
