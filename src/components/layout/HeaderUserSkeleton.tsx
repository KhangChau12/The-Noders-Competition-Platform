'use client';

import React from 'react';

export function HeaderUserSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <div className="w-7 h-7 rounded-full bg-white/[0.08] animate-pulse" />
      <div className="w-16 h-4 rounded-md bg-white/[0.08] animate-pulse hidden sm:block" />
    </div>
  );
}

export default HeaderUserSkeleton;
