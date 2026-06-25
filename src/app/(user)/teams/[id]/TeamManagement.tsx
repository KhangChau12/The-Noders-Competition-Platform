'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { addTeamMember, removeTeamMember, updateTeam, deleteTeam } from './actions';
import { inviteUserToTeam } from '../invitations/actions';
import {
  UserPlus,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Mail,
  Save,
  X,
  Send,
} from 'lucide-react';

interface Props {
  team: any;
  members: any[];
  pendingInvites: any[];
  isLeader: boolean;
}

type Toast = { type: 'success' | 'error'; text: string } | null;

export default function TeamManagement({ team, members, isLeader }: Props) {
  const router = useRouter();

  // ── Edit team state ──
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(team.name);
  const [editDesc, setEditDesc] = useState(team.description || '');
  const [editLoading, setEditLoading] = useState(false);
  const [editToast, setEditToast] = useState<Toast>(null);

  // ── Add/invite member state ──
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMode, setMemberMode] = useState<'direct' | 'invite'>('invite');
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberToast, setMemberToast] = useState<Toast>(null);

  // ── Remove member state ──
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removeToast, setRemoveToast] = useState<Toast>(null);

  // ── Delete team state ──
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteToast, setDeleteToast] = useState<Toast>(null);

  if (!isLeader) return null;

  // ── Handlers ──
  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditToast(null);
    const result = await updateTeam(team.id, { name: editName, description: editDesc });
    if ('error' in result) {
      setEditToast({ type: 'error', text: result.error as string });
    } else {
      setEditToast({ type: 'success', text: 'Team updated.' });
      setEditOpen(false);
      router.refresh();
    }
    setEditLoading(false);
  };

  const handleAddOrInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberLoading(true);
    setMemberToast(null);
    const result =
      memberMode === 'direct'
        ? await addTeamMember(team.id, memberEmail)
        : await inviteUserToTeam(team.id, memberEmail);
    if ('error' in result) {
      setMemberToast({ type: 'error', text: result.error as string });
    } else {
      setMemberToast({
        type: 'success',
        text: memberMode === 'direct' ? 'Member added.' : 'Invitation sent.',
      });
      setMemberEmail('');
      router.refresh();
      setTimeout(() => setMemberToast(null), 4000);
    }
    setMemberLoading(false);
  };

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    setRemoveToast(null);
    const result = await removeTeamMember(team.id, userId);
    if ('error' in result) {
      setRemoveToast({ type: 'error', text: result.error as string });
    } else {
      setRemoveToast({ type: 'success', text: 'Member removed.' });
      setConfirmRemoveId(null);
      router.refresh();
      setTimeout(() => setRemoveToast(null), 3000);
    }
    setRemovingId(null);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteToast(null);
    const result = await deleteTeam(team.id);
    if ('error' in result) {
      setDeleteToast({ type: 'error', text: result.error as string });
      setDeleteLoading(false);
    } else {
      router.push('/teams');
    }
  };

  const nonLeaderMembers = members.filter((m: any) => m.user_id !== team.leader_id);

  return (
    <div className="space-y-4">

      {/* ── Section: Edit team info ── */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">Team Info</h3>
          {!editOpen && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setEditName(team.name);
                setEditDesc(team.description || '');
                setEditOpen(true);
                setEditToast(null);
              }}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </Button>
          )}
        </div>

        {editToast && (
          <ToastBanner toast={editToast} onDismiss={() => setEditToast(null)} className="mb-4" />
        )}

        {editOpen ? (
          <form onSubmit={handleUpdateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Team Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                className="w-full px-3.5 py-2.5 bg-bg-elevated border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-text-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-3.5 py-2.5 bg-bg-elevated border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-text-primary text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" className="gap-1.5" disabled={editLoading} loading={editLoading}>
                <Save className="w-3.5 h-3.5" />
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setEditOpen(false); setEditToast(null); }}
                disabled={editLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-text-tertiary text-xs">Name</span>
              <p className="font-semibold text-text-primary">{team.name}</p>
            </div>
            <div>
              <span className="text-text-tertiary text-xs">Description</span>
              <p className="text-text-secondary">{team.description || <span className="italic text-text-tertiary">None</span>}</p>
            </div>
          </div>
        )}
      </Card>

      {/* ── Section: Add / invite member ── */}
      <Card className="p-5 sm:p-6">
        <h3 className="font-bold text-base mb-4">Add Member</h3>

        {memberToast && (
          <ToastBanner toast={memberToast} onDismiss={() => setMemberToast(null)} className="mb-4" />
        )}

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-bg-elevated rounded-lg mb-4 w-fit">
          {(['invite', 'direct'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setMemberMode(mode); setMemberToast(null); setMemberEmail(''); }}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                memberMode === mode
                  ? 'bg-bg-surface text-text-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              {mode === 'invite' ? 'Send Invitation' : 'Add Directly'}
            </button>
          ))}
        </div>

        <form onSubmit={handleAddOrInvite} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="member@example.com"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-bg-elevated border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm text-text-primary placeholder:text-text-tertiary"
            />
          </div>
          <p className="text-xs text-text-tertiary">
            {memberMode === 'invite'
              ? 'The user will receive an invitation to accept from their dashboard.'
              : 'The user will be added immediately without their confirmation.'}
          </p>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="gap-1.5"
            disabled={memberLoading || !memberEmail}
            loading={memberLoading}
          >
            {memberMode === 'invite' ? (
              <><Send className="w-3.5 h-3.5" /> Send Invitation</>
            ) : (
              <><UserPlus className="w-3.5 h-3.5" /> Add Member</>
            )}
          </Button>
        </form>
      </Card>

      {/* ── Section: Manage members (remove) ── */}
      {nonLeaderMembers.length > 0 && (
        <Card className="p-5 sm:p-6">
          <h3 className="font-bold text-base mb-4">
            Manage Members
            <span className="ml-2 text-sm font-normal text-text-tertiary">({nonLeaderMembers.length})</span>
          </h3>

          {removeToast && (
            <ToastBanner toast={removeToast} onDismiss={() => setRemoveToast(null)} className="mb-4" />
          )}

          <div className="space-y-1">
            {nonLeaderMembers.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-elevated/60 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {member.users.full_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">{member.users.email}</p>
                </div>

                {confirmRemoveId === member.user_id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-text-tertiary">Remove?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemove(member.user_id)}
                      disabled={removingId === member.user_id}
                      loading={removingId === member.user_id}
                      className="px-2.5 py-1 text-xs"
                    >
                      Yes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmRemoveId(null)}
                      disabled={removingId === member.user_id}
                      className="px-2.5 py-1 text-xs"
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmRemoveId(member.user_id)}
                    disabled={!!removingId}
                    className="shrink-0 text-text-tertiary hover:text-error hover:bg-error/10 px-2.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Section: Danger zone ── */}
      <Card className="p-5 sm:p-6 border-error/20">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h3 className="font-bold text-base text-error">Danger Zone</h3>
            <p className="text-xs text-text-tertiary mt-0.5">Permanently delete this team and remove all members.</p>
          </div>
          {!deleteOpen && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0 text-error hover:text-error hover:border-error hover:bg-error/5"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Team
            </Button>
          )}
        </div>

        {deleteToast && (
          <ToastBanner toast={deleteToast} onDismiss={() => setDeleteToast(null)} className="mb-3" />
        )}

        {deleteOpen && (
          <div className="p-4 bg-error/5 border border-error/20 rounded-lg space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                This action <strong>cannot be undone</strong>. Teams with active competition registrations cannot be deleted.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                className="gap-1.5"
                onClick={handleDelete}
                disabled={deleteLoading}
                loading={deleteLoading}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete permanently
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDeleteOpen(false); setDeleteToast(null); }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

    </div>
  );
}

// ── Toast banner ─────────────────────────────────────────────────────────────
function ToastBanner({
  toast,
  onDismiss,
  className = '',
}: {
  toast: { type: 'success' | 'error'; text: string };
  onDismiss: () => void;
  className?: string;
}) {
  const isSuccess = toast.type === 'success';
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-sm ${
        isSuccess
          ? 'bg-success/10 border-success/20 text-success'
          : 'bg-error/10 border-error/20 text-error'
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 shrink-0" />
        )}
        <span>{toast.text}</span>
      </div>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
