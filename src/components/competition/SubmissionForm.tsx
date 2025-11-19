'use client';

import React, { useState } from 'react';
import FileUpload from '../ui/FileUpload';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface SubmissionFormProps {
  competitionId: string;
  onSubmit: (file: File) => Promise<{ success: boolean; error?: string }>;
  maxSizeMB?: number;
  dailyLimit?: number;
  totalLimit?: number;
  remainingDaily?: number;
  remainingTotal?: number;
  disabled?: boolean;
  className?: string;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({
  competitionId,
  onSubmit,
  maxSizeMB = 10,
  dailyLimit = 5,
  totalLimit = 50,
  remainingDaily = 5,
  remainingTotal = 50,
  disabled = false,
  className = '',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
  };

  const handleSubmitClick = () => {
    if (!selectedFile) {
      setError('Please select a file to submit');
      return;
    }

    if (remainingDaily <= 0) {
      setError('Daily submission limit reached. Try again tomorrow.');
      return;
    }

    if (remainingTotal <= 0) {
      setError('Total submission limit reached for this competition.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedFile) return;

    setShowConfirmModal(false);
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit(selectedFile);

      if (result.success) {
        setSuccess(true);
        setSelectedFile(null);
        setError(null);
      } else {
        setError(result.error || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-bg-surface border border-border-default rounded-lg p-6 ${className}`}>
      {/* Submission Limits */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="bg-bg-primary rounded-lg p-4 border border-border-default">
          <p className="text-sm text-text-tertiary mb-1">Daily Remaining</p>
          <p className="text-2xl font-bold font-mono text-primary-blue">
            {remainingDaily} / {dailyLimit}
          </p>
        </div>
        <div className="bg-bg-primary rounded-lg p-4 border border-border-default">
          <p className="text-sm text-text-tertiary mb-1">Total Remaining</p>
          <p className="text-2xl font-bold font-mono text-primary-blue">
            {remainingTotal} / {totalLimit}
          </p>
        </div>
      </div>

      {/* File Upload */}
      <FileUpload
        onFileSelect={handleFileSelect}
        accept=".csv"
        maxSizeMB={maxSizeMB}
        disabled={disabled || isSubmitting}
        label="Upload Submission File"
        helperText="Upload a CSV file with your predictions. Must include 'id' and 'prediction' columns."
        className="mb-6"
      />

      {/* Success Message */}
      {success && (
        <div
          className="mb-6 p-4 bg-success/10 border border-success/30 rounded-lg flex items-start gap-3"
          role="alert"
        >
          <svg
            className="w-5 h-5 text-success mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-semibold text-success">Submission Successful!</p>
            <p className="text-sm text-text-secondary mt-1">
              Your submission is being processed. Results will be available shortly.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-start gap-3"
          role="alert"
        >
          <svg
            className="w-5 h-5 text-error mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-semibold text-error">Submission Failed</p>
            <p className="text-sm text-text-secondary mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmitClick}
        disabled={!selectedFile || disabled || isSubmitting || remainingDaily <= 0 || remainingTotal <= 0}
        loading={isSubmitting}
        variant="primary"
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Solution'}
      </Button>

      {/* Guidelines */}
      <div className="mt-6 p-4 bg-bg-primary rounded-lg border border-border-default">
        <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-blue" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          Submission Guidelines
        </h4>
        <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
          <li>CSV file must contain exactly 2 columns: 'id' and 'prediction'</li>
          <li>File size must not exceed {maxSizeMB}MB</li>
          <li>All IDs from the test set must be present</li>
          <li>No duplicate IDs allowed</li>
          <li>You have {dailyLimit} submissions per day</li>
        </ul>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Submission"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSubmit}
            >
              Confirm & Submit
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to submit this file?
          </p>

          {selectedFile && (
            <div className="bg-bg-primary p-4 rounded-lg border border-border-default">
              <p className="text-sm text-text-tertiary mb-1">File Name</p>
              <p className="font-semibold text-text-primary">{selectedFile.name}</p>
              <p className="text-sm text-text-tertiary mt-2">
                Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <p className="text-sm text-warning font-semibold">
              This will count towards your daily submission limit ({remainingDaily} remaining today).
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SubmissionForm;
