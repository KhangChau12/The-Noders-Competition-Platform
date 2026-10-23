'use client';

import CsvUploader from '@/components/competition/CsvUploader';
import { submitSolution } from './actions';

interface Props {
  competitionId: string;
  teamId: string | null;
  maxMb: number;
  leftToday: number;
  blockedReason: string | null;
  tone: 'blue' | 'amber';
  metricName: string;
  decimals: number;
}

export default function SubmitForm({ competitionId, teamId, ...rest }: Props) {
  return (
    <CsvUploader
      {...rest}
      table="submissions"
      boardHref={`/competitions/${competitionId}#leaderboard`}
      submit={(fd) => submitSolution(competitionId, fd, teamId)}
    />
  );
}
