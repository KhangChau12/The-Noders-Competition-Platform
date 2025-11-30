import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import RegisterForm from './RegisterForm';
import { ArrowLeft, Trophy, Users, Clock } from 'lucide-react';

interface RegisterPageProps {
  params: {
    id: string;
  };
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { id } = params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/competitions/${id}/register`);
  }

  // Fetch competition details
  const { data: competition } = (await supabase
    .from('competitions')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()) as { data: any };

  if (!competition) {
    redirect('/competitions');
  }

  // Get registration dates for display
  const registrationStart = new Date(competition.registration_start);
  const registrationEnd = new Date(competition.registration_end);

  // Allow late registration - no time restriction

  // Check if already registered
  const { data: existingRegistration } = (await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', id)
    .single()) as { data: any };

  if (existingRegistration) {
    redirect(`/competitions/${id}`);
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/competitions/${id}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-blue transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Competition
        </Link>

        <div className="mb-8">
          <h1 className="font-brand text-4xl sm:text-5xl mb-2 gradient-text">
            Register for Competition
          </h1>
          <p className="text-text-secondary">{competition.title}</p>
        </div>

        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4">Competition Details</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {competition.participation_type === 'individual' ? (
                <Trophy className="w-5 h-5 text-primary-blue mt-0.5" />
              ) : (
                <Users className="w-5 h-5 text-primary-blue mt-0.5" />
              )}
              <div>
                <div className="font-semibold">Participation Type</div>
                <div className="text-text-secondary">
                  {competition.participation_type === 'individual'
                    ? 'Individual'
                    : 'Team'}
                </div>
              </div>
            </div>

            {competition.participation_type === 'team' && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary-blue mt-0.5" />
                <div>
                  <div className="font-semibold">Team Size</div>
                  <div className="text-text-secondary">
                    {competition.min_team_size} - {competition.max_team_size} members
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary-blue mt-0.5" />
              <div>
                <div className="font-semibold">Registration Deadline</div>
                <div className="text-text-secondary">
                  {registrationEnd.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <RegisterForm competitionId={id} />
      </div>
    </div>
  );
}
