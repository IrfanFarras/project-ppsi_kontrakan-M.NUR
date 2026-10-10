import React from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className = "",
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: "bg-success-bg text-success border-success-border",
    warning: "bg-warning-bg text-warning border-warning-border",
    danger: "bg-error-bg text-error border-error-border",
    info: "bg-info-bg text-info border-info-border",
    neutral: "bg-surface-muted text-ink-muted border-border",
  };

  const appliedStyle = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium whitespace-nowrap rounded-md border ${appliedStyle} ${className}`}
    >
      {children}
    </span>
  );
};
