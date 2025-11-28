'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { submitSolution } from './actions';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Trophy,
  X,
} from 'lucide-react';

interface SubmitFormProps {
  competitionId: string;
  competition: any;
  submissionCount: {
    daily: number;
    total: number;
  };
}

export default function SubmitForm({
  competitionId,
  competition,
  submissionCount,
}: SubmitFormProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setSubmitError('Only CSV files are allowed');
      return;
    }

    // Validate file size
    const maxSize = (competition.max_file_size_mb || 10) * 1024 * 1024;
    if (file.size > maxSize) {
      setSubmitError(`File size exceeds ${competition.max_file_size_mb || 10}MB limit`);
      return;
    }

    setSelectedFile(file);
    setSubmitError('');
    setSubmitMessage('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setSubmitError('');
    setSubmitMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setSubmitError('Please select a file');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    const result = await submitSolution(competitionId, formData);

    if (result?.error) {
      setSubmitError(result.error);
      setIsSubmitting(false);
    } else if (result?.success) {
      setSubmitMessage(result.message || 'Submission successful! Your submission is being validated and scored.');
      setSelectedFile(null);
      setIsSubmitting(false);

      // Refresh the page to show new submission
      router.refresh();
    }
  };

  // Check if user can submit
  const canSubmit = () => {
    const now = new Date();
    const publicTestEnd = new Date(competition.public_test_end);
    const privateTestEnd = competition.private_test_end
      ? new Date(competition.private_test_end)
      : null;
    const registrationEnd = new Date(competition.registration_end);

    let currentPhase = 'ended';
    if (now >= registrationEnd && now < publicTestEnd) {
      currentPhase = 'public_test';
    } else if (privateTestEnd && now >= publicTestEnd && now < privateTestEnd) {
      currentPhase = 'private_test';
    }

    if (currentPhase !== 'public_test' && currentPhase !== 'private_test') {
      return false;
    }

    if (submissionCount.daily >= (competition.daily_submission_limit || 5)) {
      return false;
    }

    return true;
  };

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Upload className="w-6 h-6 text-primary-blue" />
        Upload Submission
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            isDragging
              ? 'border-primary-blue bg-primary-blue/10'
              : 'border-border-default hover:border-border-focus'
          } ${!canSubmit() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => {
            if (canSubmit()) {
              document.getElementById('file-input')?.click();
            }
          }}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={!canSubmit()}
          />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-4">
              <FileText className="w-12 h-12 text-success" />
              <div className="text-left">
                <div className="font-medium">{selectedFile.name}</div>
                <div className="text-sm text-text-tertiary">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
              <p className="text-lg font-medium mb-2">
                {canSubmit()
                  ? 'Drag and drop your CSV file here'
                  : 'Submission not allowed'}
              </p>
              <p className="text-sm text-text-tertiary">
                {canSubmit() ? 'or click to browse' : 'Check quota and competition phase'}
              </p>
            </>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!selectedFile || !canSubmit() || isSubmitting}
            loading={isSubmitting}
          >
            <Trophy className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Solution'}
          </Button>
        </div>

        {/* Messages */}
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

        {/* Submission Rules */}
        <div className="mt-6 p-4 bg-bg-tertiary rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Submission Rules
          </h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• File must be in CSV format</li>
            <li>• Maximum file size: {competition.max_file_size_mb || 10}MB</li>
            <li>• Daily limit: {competition.daily_submission_limit || 5} submissions</li>
            <li>• Submissions only allowed during Public Test and Private Test phases</li>
          </ul>
        </div>
      </form>
    </Card>
  );
}
