import { useState } from "react";
import { apiFetch } from "@/lib/api";

/**
 * State + aksi untuk dialog konfirmasi hapus.
 *
 *   const del = useConfirmDelete<Tenant>("/tenants", fetchData);
 *   <Button onClick={() => del.request(t)}>Hapus</Button>
 *   <ConfirmDialog isOpen={!!del.target} loading={del.busy} error={del.error}
 *     onConfirm={del.confirm} onCancel={del.cancel} ... />
 */
export function useConfirmDelete<T extends { id: number }>(
  basePath: string,
  onDeleted: () => Promise<void> | void
) {
  const [target, setTarget] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const request = (item: T) => {
    setError("");
    setTarget(item);
  };

  const cancel = () => {
    if (!busy) setTarget(null);
  };

  const confirm = async () => {
    if (!target) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`${basePath}/${target.id}`, { method: "DELETE" });
      setTarget(null);
      await onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus data");
    } finally {
      setBusy(false);
    }
  };

  return { target, busy, error, request, cancel, confirm };
}
