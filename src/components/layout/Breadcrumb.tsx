'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbItems = items || generateBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-2 text-sm', className)}>
      <Link
        href="/"
        className="flex items-center gap-1 text-text-tertiary hover:text-primary-blue transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>

      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-text-tertiary hover:text-primary-blue transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast ? 'text-text-primary font-semibold' : 'text-text-tertiary'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';

  for (let i = 0; i < paths.length; i++) {
    const segment = paths[i];
    currentPath += `/${segment}`;

    // Skip dynamic segments like [id]
    if (segment.startsWith('[') && segment.endsWith(']')) {
      continue;
    }

    // Format the label
    const label = formatLabel(segment);

    // Don't link the last item
    const href = i < paths.length - 1 ? currentPath : undefined;

    breadcrumbs.push({ label, href });
  }

  return breadcrumbs;
}

function formatLabel(segment: string): string {
  // Common mappings
  const mappings: Record<string, string> = {
    'dashboard': 'Dashboard',
    'competitions': 'Competitions',
    'competition': 'Competition',
    'admin': 'Admin',
    'profile': 'Profile',
    'teams': 'Teams',
    'submit': 'Submit',
    'leaderboard': 'Leaderboard',
    'submissions': 'Submissions',
    'analytics': 'Analytics',
    'register': 'Register',
    'create': 'Create',
    'about': 'About',
  };

  if (mappings[segment]) {
    return mappings[segment];
  }

  // Default: capitalize first letter and replace dashes/underscores with spaces
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
