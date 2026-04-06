'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Trash2, Plus, Pencil, Check, X, Tag } from 'lucide-react';
import { createTag, updateTag, deleteTag } from './actions';
import type { PracticeTag } from '@/types/database.types';

interface Props {
  tags: PracticeTag[];
}

export default function TagManager({ tags }: Props) {
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    const fd = new FormData();
    fd.set('name', newName);
    startTransition(async () => {
      const result = await createTag(fd);
      if (result?.error) {
        setError(result.error as string);
      } else {
        setNewName('');
      }
    });
  }

  function handleUpdate(id: string) {
    if (!editingName.trim()) return;
    setError(null);
    const fd = new FormData();
    fd.set('name', editingName);
    startTransition(async () => {
      const result = await updateTag(id, fd);
      if (result?.error) {
        setError(result.error as string);
      } else {
        setEditingId(null);
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete tag "${name}"? This will remove it from all practice problems.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteTag(id);
      if (result?.error) setError(result.error as string);
    });
  }

  return (
    <div className="space-y-6">
      {/* Create new tag */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary-blue" />
          Add New Tag
        </h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <Input
            placeholder="e.g. CV/Classification"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
            disabled={isPending}
          />
          <Button type="submit" variant="primary" disabled={isPending || !newName.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
        </form>
        {error && <p className="text-error text-sm mt-2">{error}</p>}
      </Card>

      {/* Existing tags */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border-default bg-bg-tertiary">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="w-5 h-5" />
            All Tags ({tags.length})
          </h2>
        </div>

        {tags.length === 0 ? (
          <div className="p-12 text-center text-text-tertiary">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No tags yet. Create one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-default">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between px-6 py-4 hover:bg-bg-tertiary/50">
                {editingId === tag.id ? (
                  <div className="flex items-center gap-3 flex-1 mr-4">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                      disabled={isPending}
                      autoFocus
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdate(tag.id)}
                      disabled={isPending || !editingName.trim()}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      disabled={isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Badge variant="tech">{tag.name}</Badge>
                    <span className="text-xs text-text-tertiary font-mono">{tag.slug}</span>
                  </div>
                )}

                {editingId !== tag.id && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingId(tag.id); setEditingName(tag.name); setError(null); }}
                      disabled={isPending}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tag.id, tag.name)}
                      disabled={isPending}
                      className="text-error hover:border-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
