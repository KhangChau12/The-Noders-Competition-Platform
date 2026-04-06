'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { submitPracticeSolution } from './actions';
import { Upload, FileText, AlertCircle, CheckCircle2, BookOpen, X } from 'lucide-react';

interface Props {
  problemId: string;
  maxFileSizeMb: number;
  dailySubmissionLimit: number;
  dailyUsed: number;
}

export default function PracticeSubmitForm({ problemId, maxFileSizeMb, dailySubmissionLimit, dailyUsed }: Props) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const canSubmit = dailyUsed < dailySubmissionLimit;

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setSubmitError('Only CSV files are allowed');
      return;
    }
    const maxBytes = maxFileSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setSubmitError(`File size exceeds ${maxFileSizeMb}MB limit`);
      return;
    }
    setSelectedFile(file);
    setSubmitError('');
    setSubmitMessage('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { setSubmitError('Please select a file'); return; }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    const fd = new FormData();
    fd.append('file', selectedFile);

    const result = await submitPracticeSolution(problemId, fd);

    if (result?.error) {
      setSubmitError(result.error as string);
      setIsSubmitting(false);
    } else if (result?.success) {
      setSubmitMessage(result.message as string);
      setSelectedFile(null);
      setIsSubmitting(false);
      router.refresh();
    }
  };

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Upload className="w-6 h-6 text-primary-blue" />
        Upload Submission
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Quota indicator */}
        <div className="mb-6 flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
          <span className="text-sm text-text-secondary">Daily submissions used</span>
          <span className={`font-mono font-bold ${dailyUsed >= dailySubmissionLimit ? 'text-error' : 'text-success'}`}>
            {dailyUsed} / {dailySubmissionLimit}
          </span>
        </div>

        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            isDragging ? 'border-primary-blue bg-primary-blue/10' : 'border-border-default hover:border-border-focus'
          } ${!canSubmit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={(e) => { e.preventDefault(); if (canSubmit) setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={canSubmit ? handleDrop : undefined}
          onClick={() => { if (canSubmit) document.getElementById('practice-file-input')?.click(); }}
        >
          <input
            id="practice-file-input"
            type="file"
            accept=".csv"
            className="hidden"
            disabled={!canSubmit}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-4">
              <FileText className="w-12 h-12 text-success" />
              <div className="text-left">
                <div className="font-medium">{selectedFile.name}</div>
                <div className="text-sm text-text-tertiary">{(selectedFile.size / 1024).toFixed(2)} KB</div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setSubmitError(''); }}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
              <p className="text-lg font-medium mb-2">
                {canSubmit ? 'Drag and drop your CSV file here' : 'Daily submission limit reached'}
              </p>
              <p className="text-sm text-text-tertiary">
                {canSubmit ? 'or click to browse' : 'Come back tomorrow!'}
              </p>
            </>
          )}
        </div>

        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!selectedFile || !canSubmit || isSubmitting}
            loading={isSubmitting}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Solution'}
          </Button>
        </div>

        {submitError && (
          <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
            <p className="text-error">{submitError}</p>
          </div>
        )}

        {submitMessage && (
          <div className="mt-4 p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
            <p className="text-success">{submitMessage}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-bg-tertiary rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Submission Rules
          </h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• File must be CSV format with columns: <code className="text-primary-blue">id,label</code></li>
            <li>• Maximum file size: {maxFileSizeMb}MB</li>
            <li>• Daily limit: {dailySubmissionLimit} submissions (resets midnight)</li>
            <li>• Submit anytime — no deadline!</li>
          </ul>
        </div>
      </form>
    </Card>
  );
}
