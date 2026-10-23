'use client';

import ConfirmDelete from '@/components/admin/ConfirmDelete';
import { deletePracticeProblem } from './[id]/edit/actions';

export default function DeletePracticeProblemButton({ problemId, problemTitle, after }: { problemId: string; problemTitle: string; after?: string }) {
  return (
    <ConfirmDelete
      noun="problem"
      name={problemTitle}
      note="It disappears from the practice list. Past submissions stay in the database."
      action={async () => (await deletePracticeProblem(problemId)) as { error?: string } | undefined}
      after={after}
    />
  );
}
