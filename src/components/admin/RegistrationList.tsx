'use client';

import React, { useState } from 'react';
import Table, { TableColumn } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import Modal from '../ui/Modal';

interface Registration {
  id: string;
  competitionId: string;
  competitionTitle: string;
  userId?: string;
  teamId?: string;
  userName?: string;
  teamName?: string;
  userEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface RegistrationListProps {
  registrations: Registration[];
  onApprove: (registrationId: string) => Promise<void>;
  onReject: (registrationId: string, reason?: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

const RegistrationList: React.FC<RegistrationListProps> = ({
  registrations,
  onApprove,
  onReject,
  loading = false,
  className = '',
}) => {
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async (registration: Registration) => {
    setActionLoading(true);
    try {
      await onApprove(registration.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (registration: Registration) => {
    setSelectedRegistration(registration);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRegistration) return;

    setActionLoading(true);
    try {
      await onReject(selectedRegistration.id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRegistration(null);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: TableColumn<Registration>[] = [
    {
      key: 'registeredAt',
      header: 'Date',
      sortable: true,
      render: (value) => {
        const date = new Date(value);
        return (
          <div className="text-sm">
            <p className="text-text-primary">{date.toLocaleDateString()}</p>
            <p className="text-xs text-text-tertiary">{date.toLocaleTimeString()}</p>
          </div>
        );
      },
    },
    {
      key: 'competition',
      header: 'Competition',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-text-primary">{row.competitionTitle}</p>
        </div>
      ),
    },
    {
      key: 'participant',
      header: 'Participant',
      sortable: true,
      render: (_, row) => {
        const name = row.userName || row.teamName || 'Unknown';
        const isTeam = !!row.teamId;

        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                isTeam ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-primary-blue/20 text-primary-blue'
              }`}
            >
              {isTeam ? '👥' : name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{name}</p>
              {row.userEmail && (
                <p className="text-xs text-text-tertiary">{row.userEmail}</p>
              )}
              <Badge variant="secondary" className="text-xs mt-1">
                {isTeam ? 'Team' : 'Individual'}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (value) => {
        const variantMap = {
          pending: 'yellow' as const,
          approved: 'success' as const,
          rejected: 'red' as const,
        };

        return (
          <Badge variant={variantMap[value as keyof typeof variantMap]}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (_, row) => {
        if (row.status !== 'pending') {
          return (
            <span className="text-sm text-text-tertiary">
              {row.status === 'approved' ? 'Approved' : 'Rejected'}
            </span>
          );
        }

        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleApprove(row)}
              disabled={actionLoading}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleRejectClick(row)}
              disabled={actionLoading}
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  // Filter pending registrations
  const pendingCount = registrations.filter((r) => r.status === 'pending').length;

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Registration Requests</h2>
          <p className="text-text-secondary mt-1">
            Review and manage competition registration requests
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="yellow" className="text-base px-4 py-2">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={registrations}
          keyExtractor={(row) => row.id}
          emptyMessage="No registration requests found."
        />
      </div>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
          setSelectedRegistration(null);
        }}
        title="Reject Registration"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
                setSelectedRegistration(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectConfirm}
              loading={actionLoading}
            >
              Reject Registration
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to reject this registration?
          </p>

          {selectedRegistration && (
            <div className="bg-bg-primary p-4 rounded-lg border border-border-default">
              <p className="text-sm text-text-tertiary mb-1">Participant</p>
              <p className="font-semibold text-text-primary">
                {selectedRegistration.userName || selectedRegistration.teamName}
              </p>
              <p className="text-sm text-text-tertiary mt-2">Competition</p>
              <p className="font-semibold text-text-primary">
                {selectedRegistration.competitionTitle}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Rejection Reason (Optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary-blue transition-colors resize-none"
              rows={4}
            />
            <p className="text-xs text-text-tertiary mt-1">
              This reason will be sent to the participant via email
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegistrationList;
