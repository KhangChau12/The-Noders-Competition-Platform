'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { createTeam } from './actions';

export default function CreateTeamForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError('');

    const result = await createTeam(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else if (result.success && result.teamId) {
      router.push(`/teams/${result.teamId}`);
      router.refresh();
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
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <p className="text-error">{error}</p>
            </div>
          )}

          <form action={handleSubmit} className="space-y-6">
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
                <Button variant="outline" className="w-full" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
