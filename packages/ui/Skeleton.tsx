import React from "react";

export interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton block. Compose with utility classes for width/height,
 * e.g. <Skeleton className="h-4 w-32" />
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return <div className={`animate-pulse rounded-md bg-surface-subtle ${className}`} />;
};

export interface SkeletonTableProps {
  columns: number;
  rows?: number;
}

/**
 * Renders `rows` skeleton <tr> matching a Table's column count.
 * Used internally by <Table loading /> — exported for custom table layouts.
 */
export const SkeletonTable: React.FC<SkeletonTableProps> = ({ columns, rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-2.5">
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};
