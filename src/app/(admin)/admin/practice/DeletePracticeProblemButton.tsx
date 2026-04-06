'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { deletePracticeProblem } from './[id]/edit/actions';

interface Props {
  problemId: string;
  problemTitle: string;
}

export default function DeletePracticeProblemButton({ problemId, problemTitle }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    const result = await deletePracticeProblem(problemId);
    if (result?.error) {
      setError(result.error as string);
      setIsDeleting(false);
    } else {
      router.refresh();
      setShowConfirm(false);
    }
  };

  const modal = showConfirm ? (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={() => setShowConfirm(false)}
    >
      <div
        className="bg-bg-surface border-2 border-error rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2 bg-error/10 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-error" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-error mb-2">Delete Practice Problem?</h3>
            <p className="text-sm text-text-secondary">
              Delete <span className="font-semibold text-text-primary">"{problemTitle}"</span>?
              This will hide it from all users (soft delete).
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error rounded text-sm text-error">{error}</div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isDeleting}>Cancel</Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-error hover:bg-error/90 border-error text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="text-error hover:bg-error/10 hover:border-error w-full"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
