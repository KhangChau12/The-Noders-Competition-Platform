'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { UserPlus, Mail } from 'lucide-react';
import { inviteUserToTeam } from '../invitations/actions';

interface InviteMemberFormProps {
  teamId: string;
}

export default function InviteMemberForm({ teamId }: InviteMemberFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const result = await inviteUserToTeam(teamId, email);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(result.message || 'Invitation sent!');
      setEmail('');
      router.refresh();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="p-4 bg-primary-blue/5 rounded-lg border border-primary-blue/20">
      <h3 className="text-sm font-semibold text-primary-blue mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4" />
        Invite New Member
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter user email..."
            required
            className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-error">{error}</p>
        )}

        {success && (
          <p className="text-sm text-success">{success}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="w-full"
          disabled={isSubmitting || !email}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
        </Button>
      </form>

      <p className="text-xs text-text-tertiary mt-3">
        The user will receive an invitation and can accept it from their dashboard.
      </p>
    </div>
  );
}
