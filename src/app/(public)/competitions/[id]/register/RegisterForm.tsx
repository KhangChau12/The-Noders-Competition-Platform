'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { registerForCompetition } from './actions';
import { CheckCircle2, AlertCircle, Users } from 'lucide-react';

interface RegisterFormProps {
  competitionId: string;
  participationType: 'individual' | 'team';
  minTeamSize?: number;
  maxTeamSize?: number;
  userTeams?: any[];
}

export default function RegisterForm({
  competitionId,
  participationType,
  minTeamSize,
  maxTeamSize,
  userTeams = [],
}: RegisterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const teamId = participationType === 'team' ? selectedTeam : null;
    const result = await registerForCompetition(competitionId, teamId);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else if (result?.success) {
      router.push(`/competitions/${competitionId}`);
      router.refresh();
    }
  };

  // Filter eligible teams based on size constraints AND leadership
  const eligibleTeams = userTeams.filter((team) => {
    // Only team leaders can register the team
    if (!team.is_leader) return false;

    const memberCount = team.member_count || 0;
    if (minTeamSize && memberCount < minTeamSize) return false;
    if (maxTeamSize && memberCount > maxTeamSize) return false;
    return true;
  });

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-4">Confirm Registration</h2>
      <p className="text-text-secondary mb-6">
        {participationType === 'team'
          ? 'Select your team and confirm registration. Your registration will be pending admin approval.'
          : 'By clicking the button below, you confirm that you want to register for this competition. Your registration will be pending admin approval.'}
      </p>

      {error && (
        <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Selection (for team competitions) */}
        {participationType === 'team' && (
          <div>
            <label htmlFor="team" className="block text-sm font-semibold mb-2">
              Select Your Team <span className="text-error">*</span>
            </label>

            {eligibleTeams.length > 0 ? (
              <div className="space-y-3">
                {eligibleTeams.map((team) => (
                  <label
                    key={team.id}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTeam === team.id
                        ? 'border-primary-blue bg-primary-blue/5'
                        : 'border-border-default bg-bg-surface hover:border-primary-blue/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="team"
                      value={team.id}
                      checked={selectedTeam === team.id}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      required
                      className="w-4 h-4 text-primary-blue focus:ring-2 focus:ring-primary-blue"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{team.name}</span>
                        <Badge variant="blue" className="text-xs">Leader</Badge>
                      </div>
                      <p className="text-sm text-text-tertiary mt-0.5">
                        {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </label>
                ))}
                <p className="text-sm text-text-tertiary">
                  Team size requirement: {minTeamSize}-{maxTeamSize} members
                </p>
              </div>
            ) : (
              <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-warning mb-2">No Eligible Teams</p>

                    {userTeams.length === 0 ? (
                      <p className="text-sm text-text-secondary mb-3">
                        You need to create a team to participate in this competition.
                      </p>
                    ) : userTeams.every((t) => !t.is_leader) ? (
                      <div>
                        <p className="text-sm text-text-secondary mb-3">
                          Only team leaders can register teams for competitions.
                        </p>
                        <div className="space-y-2 mb-3">
                          {userTeams.map((team) => (
                            <div key={team.id} className="flex items-center justify-between p-2 bg-bg-surface rounded">
                              <span className="text-sm">{team.name}</span>
                              <Badge variant="yellow">Member</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-text-secondary mb-3">
                          Your teams don't meet the size requirement ({minTeamSize}-{maxTeamSize} members).
                        </p>
                        <div className="space-y-2 mb-3">
                          {userTeams.filter(t => t.is_leader).map((team) => {
                            const memberCount = team.member_count || 0;
                            const tooSmall = memberCount < (minTeamSize || 0);
                            const tooLarge = memberCount > (maxTeamSize || 99);

                            return (
                              <div key={team.id} className="flex items-center justify-between p-2 bg-bg-surface rounded">
                                <span className="text-sm">
                                  {team.name} ({memberCount} member{memberCount !== 1 ? 's' : ''})
                                </span>
                                <Badge variant="red">
                                  {tooSmall ? 'Too small' : 'Too large'}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <a
                      href="/teams"
                      className="inline-flex items-center gap-2 text-sm text-primary-blue hover:underline"
                    >
                      <Users className="w-4 h-4" />
                      {userTeams.length === 0 ? 'Create a Team' : 'Manage Teams'}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={
            isSubmitting || (participationType === 'team' && eligibleTeams.length === 0)
          }
          loading={isSubmitting}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {isSubmitting ? 'Registering...' : 'Confirm Registration'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-bg-tertiary rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning" />
          Important Information
        </h3>
        <ul className="text-sm text-text-secondary space-y-1">
          {participationType === 'team' && (
            <li>• Only the team leader can register the team</li>
          )}
          <li>• Your registration requires admin approval</li>
          <li>• You will be notified once your registration is reviewed</li>
          <li>• You can view your registration status on the competition page</li>
          <li>• Once approved, you can start submitting solutions</li>
        </ul>
      </div>
    </Card>
  );
}
