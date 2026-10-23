'use client';

import { PageBand } from '@/components/ui/PageBand';
import CompetitionEditor from '@/components/admin/CompetitionEditor';
import { DEFAULT_SUBMISSION_LIMITS } from '@/lib/constants';
import { createCompetition } from './actions';

export default function CreateCompetitionPage() {
  return (
    <>
      <PageBand crumbs={[{ label: 'Competitions', href: '/admin/competitions' }, { label: 'New' }]} title="New competition" description="Takes about five minutes. Have the answer key CSV ready." />
      <div className="shell pb-24 pt-10 sm:pt-12">
        <CompetitionEditor
          mode="create"
          save={createCompetition}
          initial={{
            title: '',
            description: '',
            problem_statement: '',
            competition_type: '3-phase',
            participation_type: 'individual',
            scoring_metric: 'f1_score',
            registration_start: null,
            registration_end: null,
            public_test_end: null,
            private_test_end: null,
            dataset_url: null,
            sample_submission_url: null,
            daily_submission_limit: DEFAULT_SUBMISSION_LIMITS.DAILY,
            total_submission_limit: DEFAULT_SUBMISSION_LIMITS.TOTAL,
            max_file_size_mb: DEFAULT_SUBMISSION_LIMITS.MAX_FILE_SIZE_MB,
            min_team_size: 1,
            max_team_size: 3,
          }}
        />
      </div>
    </>
  );
}
