import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

async function registerForCompetition(competitionId: string, userId: string) {
  'use server';
  const supabase = await createClient();

  // Check if already registered
  const { data: existingRegistration } = await supabase
    .from('registrations')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('user_id', userId)
    .single();

  if (existingRegistration) {
    return { error: 'You have already registered for this competition' };
  }

  // Create registration
  const { data, error } = await supabase
    .from('registrations')
    .insert({
      competition_id: competitionId,
      user_id: userId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, data };
}

export default async function RegisterPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get competition details
  const { data: competition } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!competition) {
    redirect('/competitions');
  }

  // Check current phase
  const now = new Date();
  const registrationStart = new Date(competition.registration_start);
  const registrationEnd = new Date(competition.registration_end);

  const isRegistrationOpen = now >= registrationStart && now <= registrationEnd;

  // Check existing registration
  const { data: existingRegistration } = await supabase
    .from('registrations')
    .select('*')
    .eq('competition_id', params.id)
    .eq('user_id', user.id)
    .single();

  // Handle registration submission
  async function handleRegister(formData: FormData) {
    'use server';
    const result = await registerForCompetition(params.id, user!.id);

    if (result.error) {
      // In real app, show error toast
      console.error(result.error);
    } else {
      redirect(`/competition/${params.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          href={`/competitions/${params.id}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Competition
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Register for Competition</h1>
          <p className="text-text-secondary">{competition.title}</p>
        </div>

        {/* Already Registered */}
        {existingRegistration && (
          <Card className="p-6 mb-6">
            {existingRegistration.status === 'pending' && (
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-warning mb-2">Registration Pending</h3>
                  <p className="text-text-secondary mb-4">
                    You have already registered for this competition. Your registration is currently pending admin approval.
                  </p>
                  <Link href={`/competition/${params.id}`}>
                    <Button variant="outline">Back to Competition</Button>
                  </Link>
                </div>
              </div>
            )}

            {existingRegistration.status === 'approved' && (
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-success mb-2">Already Registered</h3>
                  <p className="text-text-secondary mb-4">
                    You are already registered and approved for this competition.
                  </p>
                  <Link href={`/competition/${params.id}`}>
                    <Button variant="primary">Go to Competition</Button>
                  </Link>
                </div>
              </div>
            )}

            {existingRegistration.status === 'rejected' && (
              <div className="flex items-start gap-4">
                <XCircle className="w-6 h-6 text-error flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-error mb-2">Registration Rejected</h3>
                  <p className="text-text-secondary mb-4">
                    Your registration for this competition was not approved. Please contact the organizers for more information.
                  </p>
                  <Link href={`/competitions`}>
                    <Button variant="outline">Browse Other Competitions</Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Registration Not Open */}
        {!isRegistrationOpen && !existingRegistration && (
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <XCircle className="w-6 h-6 text-error flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-error mb-2">Registration Closed</h3>
                <p className="text-text-secondary mb-4">
                  {now < registrationStart
                    ? `Registration opens on ${registrationStart.toLocaleDateString()}`
                    : 'Registration for this competition has ended'}
                </p>
                <Link href={`/competition/${params.id}`}>
                  <Button variant="outline">Back to Competition</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Registration Form */}
        {isRegistrationOpen && !existingRegistration && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Complete Your Registration</h2>

            {/* Competition Info */}
            <div className="bg-bg-elevated p-6 rounded-lg border border-border-default mb-8">
              <h3 className="font-semibold mb-4">Competition Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Type:</span>
                  <span className="font-medium">{competition.participation_type === 'individual' ? 'Individual' : 'Team'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Daily Submission Limit:</span>
                  <span className="font-medium">{competition.daily_submission_limit} per day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Max File Size:</span>
                  <span className="font-medium">{competition.max_file_size_mb} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Scoring Metric:</span>
                  <span className="font-medium uppercase">{competition.scoring_metric}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Terms & Conditions</h3>
              <div className="bg-bg-elevated p-4 rounded-lg border border-border-default text-sm text-text-secondary space-y-2 max-h-48 overflow-y-auto">
                <p>• I confirm that I will abide by the competition rules and regulations</p>
                <p>• I understand that my submissions will be validated against the answer key</p>
                <p>• I agree that only my best score will be displayed on the leaderboard</p>
                <p>• I understand that submission limits apply and invalid submissions don't count toward my quota</p>
                <p>• I agree to not share or discuss the competition dataset or solutions during the active competition period</p>
              </div>
            </div>

            {/* Submit Button */}
            <form action={handleRegister}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
              >
                Confirm Registration
              </Button>
            </form>

            <p className="text-sm text-text-tertiary text-center mt-4">
              Your registration will be reviewed by the competition organizers
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
