'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { registerForCompetition } from './actions';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface RegisterFormProps {
  competitionId: string;
}

export default function RegisterForm({ competitionId }: RegisterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const result = await registerForCompetition(competitionId);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else if (result?.success) {
      router.push(`/competitions/${competitionId}`);
      router.refresh();
    }
  };

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-4">Confirm Registration</h2>
      <p className="text-text-secondary mb-6">
        By clicking the button below, you confirm that you want to register for this
        competition. Your registration will be pending admin approval.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {isSubmitting ? 'Registering...' : 'Confirm Registration'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-bg-tertiary rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning" />
          Important Information
        </h3>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>• Your registration requires admin approval</li>
          <li>• You will be notified once your registration is reviewed</li>
          <li>• You can view your registration status on the competition page</li>
          <li>• Once approved, you can start submitting solutions</li>
        </ul>
      </div>
    </Card>
  );
}
