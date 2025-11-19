import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

async function createTeam(formData: FormData, userId: string) {
  'use server';
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!name || name.trim().length < 3) {
    return { error: 'Team name must be at least 3 characters' };
  }

  // Create team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      leader_id: userId
    })
    .select()
    .single();

  if (teamError) {
    return { error: teamError.message };
  }

  // Add leader as team member
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: userId
    });

  if (memberError) {
    return { error: memberError.message };
  }

  return { success: true, teamId: team.id };
}

export default async function CreateTeamPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  async function handleCreateTeam(formData: FormData) {
    'use server';
    const result = await createTeam(formData, user!.id);

    if (result.error) {
      // In real app, show error toast
      console.error(result.error);
      return;
    }

    if (result.success && result.teamId) {
      redirect(`/teams/${result.teamId}`);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create New Team</h1>
          <p className="text-text-secondary">Build your team to compete together</p>
        </div>

        {/* Create Team Form */}
        <Card className="p-8">
          <form action={handleCreateTeam} className="space-y-6">
            {/* Team Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-2">
                Team Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                minLength={3}
                maxLength={50}
                placeholder="Enter team name"
                className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-text-primary"
              />
              <p className="text-sm text-text-tertiary mt-2">
                Choose a unique name for your team (3-50 characters)
              </p>
            </div>

            {/* Team Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                maxLength={500}
                placeholder="Describe your team's goals and expertise"
                className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-text-primary resize-none"
              />
              <p className="text-sm text-text-tertiary mt-2">
                Optional: Add a description to help others understand your team
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-primary-blue/10 border border-primary-blue/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary-blue">ℹ️</span>
                Team Creation Info
              </h3>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• You will automatically become the team leader</li>
                <li>• You can invite other members after creating the team</li>
                <li>• Team members can be managed from the team page</li>
                <li>• Teams can register for team-based competitions</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Link href="/teams" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
              >
                Create Team
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
