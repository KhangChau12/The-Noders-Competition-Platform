'use client';

import ConfirmDelete from '@/components/admin/ConfirmDelete';
import { deleteCompetition } from './actions';

export default function DeleteCompetitionButton({ competitionId, competitionTitle, after }: { competitionId: string; competitionTitle: string; after?: string }) {
  return (
    <ConfirmDelete
      noun="competition"
      name={competitionTitle}
      note="It disappears from the site, with its leaderboard and registrations. Submissions and files stay in the database."
      action={() => deleteCompetition(competitionId)}
      after={after}
    />
  );
}
