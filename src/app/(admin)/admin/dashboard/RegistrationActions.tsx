'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { approveRegistration, rejectRegistration } from '../actions';
import { CheckCircle2, XCircle } from 'lucide-react';

interface RegistrationActionsProps {
  registrationId: string;
}

export default function RegistrationActions({
  registrationId,
}: RegistrationActionsProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setIsApproving(true);
    setError('');
    const result = await approveRegistration(registrationId);
    if ('error' in result && result.error) {
      setError(result.error);
      setIsApproving(false);
    }
    // On success the page revalidates and this row disappears — keep loading state.
  };

  const handleReject = async () => {
    setIsRejecting(true);
    setError('');
    const result = await rejectRegistration(registrationId);
    if ('error' in result && result.error) {
      setError(result.error);
      setIsRejecting(false);
    }
  };

  const busy = isApproving || isRejecting;

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-1.5">
      <div className="flex items-center gap-2">
        <Button
          variant="success"
          size="sm"
          onClick={handleApprove}
          disabled={busy}
          loading={isApproving}
          className="flex-1 sm:flex-none"
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          Approve
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleReject}
          disabled={busy}
          loading={isRejecting}
          className="flex-1 sm:flex-none"
        >
          <XCircle className="w-4 h-4 mr-1.5" />
          Reject
        </Button>
      </div>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
