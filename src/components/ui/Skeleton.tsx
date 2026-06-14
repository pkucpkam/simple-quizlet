import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-claude-surface border border-claude-border rounded-claude-md p-5 space-y-3 ${className}`}>
    <Skeleton className="h-5 w-2/3 rounded" />
    <SkeletonText lines={2} />
    <div className="flex gap-2 pt-1">
      <Skeleton className="h-7 w-20 rounded-claude" />
      <Skeleton className="h-7 w-20 rounded-claude" />
    </div>
  </div>
);

export const SkeletonTableRow: React.FC<{ cols?: number }> = ({ cols = 4 }) => (
  <tr className="border-b border-claude-border">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <Skeleton className={`h-4 rounded ${i === 0 ? 'w-40' : i === cols - 1 ? 'w-20 ml-auto' : 'w-24'}`} />
      </td>
    ))}
  </tr>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonTableRow key={i} cols={cols} />
    ))}
  </tbody>
);

export default Skeleton;
