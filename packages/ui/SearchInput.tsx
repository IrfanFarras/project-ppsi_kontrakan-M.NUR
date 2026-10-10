import React from "react";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

/**
 * Kolom pencarian standar (tinggi 36px) dengan ikon di kiri.
 * Dipakai sebagai input terkontrol: isi `value` dan `onChange`.
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  containerClassName = "",
  className = "",
  ...props
}) => {
  return (
    <div className={`relative flex items-center ${containerClassName}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
        className="absolute left-3 h-4 w-4 text-ink-faint pointer-events-none"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        className={`w-full h-9 pl-9 pr-3 bg-surface border border-border-strong rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors ${className}`}
        {...props}
      />
    </div>
  );
};
