'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { addTeamMember, removeTeamMember, updateTeam, deleteTeam } from './actions';
import {
  UserPlus,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCircle2,
  X,
  Mail,
  Calendar,
} from 'lucide-react';

interface TeamManagementProps {
  team: any;
  members: any[];
  isLeader: boolean;
}

export default function TeamManagement({ team, members, isLeader }: TeamManagementProps) {
  const router = useRouter();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [email, setEmail] = useState('');
  const [editName, setEditName] = useState(team.name);
  const [editDescription, setEditDescription] = useState(team.description || '');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await addTeamMember(team.id, email);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
      setLoading(false);
    } else {
      setMessage({ type: 'success', text: result.message || 'Member added successfully' });
      setEmail('');
      setShowAddMember(false);
      setLoading(false);
      router.refresh();
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    setLoading(true);
    setMessage(null);

    const result = await removeTeamMember(team.id, userId);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: result.message || 'Member removed successfully' });
      router.refresh();
    }
    setLoading(false);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await updateTeam(team.id, {
      name: editName,
      description: editDescription,
    });

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
      setLoading(false);
    } else {
      setMessage({ type: 'success', text: result.message || 'Team updated successfully' });
      setShowEditTeam(false);
      setLoading(false);
      router.refresh();
    }
  };

  const handleDeleteTeam = async () => {
    setLoading(true);
    setMessage(null);

    const result = await deleteTeam(team.id);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
      setLoading(false);
    } else {
      router.push('/teams');
      router.refresh();
    }
  };

  if (!isLeader) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg border flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-error/10 border-error/30 text-error'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* Add Member Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-blue" />
            Add Team Members
          </h3>
          {!showAddMember && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddMember(true)}
              disabled={loading}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>

        {showAddMember && (
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2">
                Member Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                required
                className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-text-primary"
              />
              <p className="text-sm text-text-tertiary mt-2">
                Enter the email address of the user you want to add to this team
              </p>
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="primary" disabled={loading} loading={loading}>
                Add Member
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddMember(false);
                  setEmail('');
                  setMessage(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Members List with Remove Option */}
        {!showAddMember && (
          <div className="space-y-3 mt-4">
            <p className="text-sm text-text-secondary">Current members ({members.length})</p>
            {members.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-bg-elevated rounded-lg border border-border-default"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-brand rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">
                      {member.users.full_name?.[0]?.toUpperCase() ||
                        member.users.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{member.users.full_name || 'Anonymous'}</p>
                    <div className="flex items-center gap-2 text-sm text-text-tertiary">
                      <Mail className="w-3 h-3" />
                      <span>{member.users.email}</span>
                    </div>
                  </div>
                  {member.user_id === team.leader_id && (
                    <Badge variant="yellow" className="ml-2">
                      Leader
                    </Badge>
                  )}
                </div>

                {member.user_id !== team.leader_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={loading}
                    className="text-error hover:text-error hover:border-error"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Team Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-accent-cyan" />
            Edit Team Information
          </h3>
          {!showEditTeam && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditTeam(true)}
              disabled={loading}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {showEditTeam ? (
          <form onSubmit={handleUpdateTeam} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-2">
                Team Name
              </label>
              <input
                type="text"
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-text-primary"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-semibold mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-text-primary resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="primary" disabled={loading} loading={loading}>
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditTeam(false);
                  setEditName(team.name);
                  setEditDescription(team.description || '');
                  setMessage(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <div>
              <span className="text-sm text-text-tertiary">Name:</span>
              <p className="font-semibold">{team.name}</p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">Description:</span>
              <p className="text-text-secondary">{team.description || 'No description'}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Team Card */}
      <Card className="p-6 border-error/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-error">
              <AlertCircle className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-text-tertiary mt-1">
              Once you delete a team, there is no going back
            </p>
          </div>
          {!showDeleteConfirm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="text-error hover:text-error hover:border-error"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Team
            </Button>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="space-y-4 bg-error/5 p-4 rounded-lg border border-error/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-error mb-1">
                  Are you absolutely sure?
                </p>
                <p className="text-sm text-text-secondary">
                  This will permanently delete the team and remove all members. You cannot delete
                  a team with active competition registrations.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDeleteTeam}
                disabled={loading}
                loading={loading}
                className="text-error hover:text-error hover:border-error hover:bg-error/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Yes, Delete Team
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMessage(null);
                }}
                disabled={loading}
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
