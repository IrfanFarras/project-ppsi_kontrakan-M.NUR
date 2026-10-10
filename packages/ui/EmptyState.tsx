import React from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Standard empty-state block for tables/lists with no data.
 * Pass `action` (usually a <Button>) to give the user a next step.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-ink-faint">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-ink-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
