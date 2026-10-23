'use client';

import CsvUploader from '@/components/competition/CsvUploader';
import { submitPracticeSolution } from './actions';

interface Props {
  problemId: string;
  maxMb: number;
  leftToday: number;
  blockedReason: string | null;
  tone: 'blue' | 'amber' | 'violet' | 'teal';
  metricName: string;
  decimals: number;
}

export default function PracticeSubmitForm({ problemId, ...rest }: Props) {
  return (
    <CsvUploader
      {...rest}
      table="practice_submissions"
      boardHref={`/practice/${problemId}#board`}
      submit={(fd) => submitPracticeSolution(problemId, fd)}
    />
  );
}
