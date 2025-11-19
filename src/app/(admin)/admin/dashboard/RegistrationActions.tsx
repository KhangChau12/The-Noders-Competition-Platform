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
  const [message, setMessage] = useState('');

  const handleApprove = async () => {
    setIsApproving(true);
    setMessage('');

    const result = await approveRegistration(registrationId);

    if (result?.error) {
      setMessage(result.error);
      setIsApproving(false);
    } else if (result?.success) {
      setMessage('Approved successfully');
      // Keep loading state - page will revalidate
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    setMessage('');

    const result = await rejectRegistration(registrationId);

    if (result?.error) {
      setMessage(result.error);
      setIsRejecting(false);
    } else if (result?.success) {
      setMessage('Rejected successfully');
      // Keep loading state - page will revalidate
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={handleApprove}
        disabled={isApproving || isRejecting}
        loading={isApproving}
      >
        <CheckCircle2 className="w-4 h-4 mr-1" />
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleReject}
        disabled={isApproving || isRejecting}
        loading={isRejecting}
      >
        <XCircle className="w-4 h-4 mr-1" />
        Reject
      </Button>
      {message && (
        <span className="text-sm text-text-secondary ml-2">{message}</span>
      )}
    </div>
  );
}
