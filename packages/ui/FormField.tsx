import React from "react";

/** Gaya seragam untuk <input>, <select>, dan <textarea> di semua form. */
export const fieldClass =
  "h-10 px-3 bg-surface border border-border-strong rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:bg-surface-muted disabled:text-ink-muted disabled:cursor-not-allowed w-full";

/** Varian untuk <textarea> (tinggi mengikuti rows). */
export const textareaClass =
  "p-3 bg-surface border border-border-strong rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent w-full";

export interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, helperText, required, children }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-ink">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
      {error && <span className="text-xs text-error">{error}</span>}
      {helperText && !error && <span className="text-xs text-ink-muted">{helperText}</span>}
    </div>
  );
};
