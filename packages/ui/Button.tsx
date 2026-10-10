import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "link-blue" | "link-red";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Tinggi kontrol: sm 32px, md 36px, lg 40px. Radius 8px.
 * Fokus keyboard memakai :focus-visible global (lihat globals.css).
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  type = "button",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-sm",
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-accent-strong border border-transparent",
    secondary: "bg-surface text-ink hover:bg-surface-muted border border-border-strong",
    danger: "bg-error text-white hover:bg-error/90 border border-transparent",
    ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink",
    "link-blue": "text-accent hover:underline underline-offset-2 p-0 h-auto",
    "link-red": "text-error hover:underline underline-offset-2 p-0 h-auto",
  };

  const isLink = variant === "link-blue" || variant === "link-red";
  const sizeClass = isLink ? "" : sizeStyles[size] || sizeStyles.md;
  const variantClass = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      type={type}
      className={`${baseStyles} ${sizeClass} ${variantClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
