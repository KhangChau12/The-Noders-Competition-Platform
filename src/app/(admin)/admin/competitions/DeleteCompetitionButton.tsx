'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { deleteCompetition } from './actions';

interface DeleteCompetitionButtonProps {
  competitionId: string;
  competitionTitle: string;
}

export default function DeleteCompetitionButton({
  competitionId,
  competitionTitle,
}: DeleteCompetitionButtonProps) {
  const router = useRouter();
  const [showFirstConfirm, setShowFirstConfirm] = useState(false);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Set mounted state for portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFirstConfirm = () => {
    setShowFirstConfirm(true);
  };

  const handleSecondConfirm = () => {
    setShowFirstConfirm(false);
    setShowSecondConfirm(true);
  };

  const handleFinalDelete = async () => {
    setIsDeleting(true);
    setError('');

    const result = await deleteCompetition(competitionId);

    if (result.error) {
      setError(result.error);
      setIsDeleting(false);
    } else {
      // Success - redirect to competitions list
      router.push('/admin/competitions');
      router.refresh();
    }
  };

  const handleCancel = () => {
    setShowFirstConfirm(false);
    setShowSecondConfirm(false);
    setError('');
  };

  const renderFirstModal = () => {
    if (!showFirstConfirm || showSecondConfirm) return null;

    return (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={handleCancel}
        >
          <div
            className="bg-bg-surface border border-border-default rounded-lg max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  Delete Competition?
                </h3>
                <p className="text-sm text-text-secondary">
                  Are you sure you want to delete <span className="font-semibold text-text-primary">"{competitionTitle}"</span>?
                </p>
                <p className="text-sm text-text-tertiary mt-2">
                  This action cannot be undone. All submissions, registrations, and leaderboard data will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleSecondConfirm}
                className="bg-warning/10 hover:bg-warning/20 border-warning text-warning"
              >
                Yes, Continue
              </Button>
            </div>
          </div>
        </div>
    );
  };

  const renderSecondModal = () => {
    if (!showSecondConfirm) return null;

    return (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={handleCancel}
        >
          <div
            className="bg-bg-surface border-2 border-error rounded-lg max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-error/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-error mb-2">
                  Final Confirmation
                </h3>
                <p className="text-sm text-text-secondary">
                  This is your last chance to cancel. Are you absolutely sure?
                </p>
                <p className="text-sm font-semibold text-text-primary mt-3">
                  Competition: "{competitionTitle}"
                </p>
                <p className="text-sm text-error mt-2">
                  ⚠️ This will permanently delete all data associated with this competition.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error rounded text-sm text-error">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                onClick={handleFinalDelete}
                disabled={isDeleting}
                className="bg-error hover:bg-error/90 border-error text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
    );
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleFirstConfirm}
        className="text-error hover:bg-error/10 hover:border-error"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Competition
      </Button>

      {/* Render modals using portal to document.body */}
      {mounted && showFirstConfirm && !showSecondConfirm && createPortal(renderFirstModal(), document.body)}
      {mounted && showSecondConfirm && createPortal(renderSecondModal(), document.body)}
    </>
  );
}
