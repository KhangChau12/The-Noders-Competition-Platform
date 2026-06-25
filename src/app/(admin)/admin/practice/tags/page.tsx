import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';
import TagManager from './TagManager';

export const metadata = { title: 'Manage Practice Tags' };

export default async function PracticeTagsPage() {
  const supabase = await createClient();

  // Auth + admin role enforced by the admin layout.
  const { data: tags } = await (supabase as any)
    .from('practice_tags')
    .select('*')
    .order('name');

  return (
    <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/practice">
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Practice Problems
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="font-brand text-3xl sm:text-4xl gradient-text mb-2 leading-tight">Manage Tags</h1>
          <p className="text-text-secondary">
            Create and manage tags used to categorize practice problems.
          </p>
        </div>

        <TagManager tags={tags ?? []} />
    </div>
  );
}
