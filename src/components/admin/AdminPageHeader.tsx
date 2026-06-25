import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Optional action slot, rendered top-right on desktop (e.g. a primary button) */
  action?: ReactNode;
}

/**
 * Standardized page header for the admin area. Replaces the repeated
 * gradient-title + description + CTA block that each admin page used to inline.
 */
export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8">
      <div className="min-w-0">
        <h1 className="font-brand text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-1.5 gradient-text leading-tight">
          {title}
        </h1>
        {description && <p className="text-sm sm:text-base text-text-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
