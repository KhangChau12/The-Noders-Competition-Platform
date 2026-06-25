'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Users, Info } from 'lucide-react';
import { createTeam } from './actions';

export default function CreateTeamForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await createTeam(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else if (result.success && result.teamId) {
      router.push(`/teams/${result.teamId}`);
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link
          href="/teams"
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Teams
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-brand text-3xl sm:text-4xl gradient-text leading-tight mb-1">
            Create Team
          </h1>
          <p className="text-sm text-text-secondary">
            You&apos;ll become the team leader and can invite members afterward.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-5 sm:p-6 space-y-5">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-error/10 border border-error/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Team Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-1.5">
                Team Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                placeholder="e.g. Neural Ninjas"
                className="w-full px-4 py-2.5 bg-bg-elevated border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-text-primary placeholder:text-text-tertiary transition-colors"
              />
              <div className="flex justify-between mt-1.5">
                <p className="text-xs text-text-tertiary">3–50 characters</p>
                <p className={`text-xs font-mono ${name.length > 45 ? 'text-warning' : 'text-text-tertiary'}`}>
                  {name.length}/50
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold mb-1.5">
                Description
                <span className="ml-1.5 text-xs font-normal text-text-tertiary">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Describe your team's goals, expertise, or what you're looking for in members..."
                className="w-full px-4 py-2.5 bg-bg-elevated border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-text-primary placeholder:text-text-tertiary resize-none transition-colors"
              />
              <p className={`text-xs font-mono mt-1.5 text-right ${description.length > 470 ? 'text-warning' : 'text-text-tertiary'}`}>
                {description.length}/500
              </p>
            </div>

            {/* Info hint */}
            <div className="flex items-start gap-2.5 p-3.5 bg-primary-blue/5 border border-primary-blue/15 rounded-lg">
              <Info className="w-4 h-4 text-primary-blue shrink-0 mt-0.5" />
              <div className="text-xs text-text-secondary space-y-0.5">
                <p>You will be automatically set as the team leader.</p>
                <p>After creating, you can invite members from the team page.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Link href="/teams" className="flex-1">
                <Button variant="outline" className="w-full" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 gap-2"
                disabled={isSubmitting || name.trim().length < 3}
                loading={isSubmitting}
              >
                <Users className="w-4 h-4" />
                {isSubmitting ? 'Creating…' : 'Create Team'}
              </Button>
            </div>
          </Card>
        </form>

      </div>
    </div>
  );
}
