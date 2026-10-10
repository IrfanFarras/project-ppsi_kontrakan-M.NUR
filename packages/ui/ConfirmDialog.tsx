import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  /** Pesan error dari server (mis. data masih dipakai), ditampilkan di dalam dialog. */
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Dialog konfirmasi untuk aksi yang menghapus data. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Hapus",
  loading = false,
  error,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="space-y-4">
        <div className="text-sm text-ink-muted">{message}</div>

        {error && (
          <p role="alert" className="text-sm text-error bg-error-bg border border-error-border rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Menghapus..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
