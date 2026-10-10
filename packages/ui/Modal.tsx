"use client";

import React, { useEffect, useRef } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Lebar dialog: sm untuk konfirmasi, md untuk form (default), lg untuk form lebar. */
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const SIZE: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
}) => {
  // Simpan onClose terbaru di ref agar efek di bawah tidak dipasang ulang tiap render
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Esc menutup dialog; scroll halaman dikunci selama dialog terbuka
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onMouseDown={(e) => {
        // Klik di area gelap (bukan di dalam dialog) menutup modal
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-surface w-full ${SIZE[size]} rounded-t-xl sm:rounded-xl border border-border shadow-lg overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]`}
      >
        <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-border">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            {description && <p className="text-sm text-ink-muted mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="h-8 w-8 -mr-1.5 -mt-1 flex items-center justify-center shrink-0 text-ink-faint hover:text-ink hover:bg-surface-muted rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
