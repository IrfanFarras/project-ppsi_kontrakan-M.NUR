"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useConfirmDelete } from "@/lib/useConfirmDelete";
import { Maintenance, Property, PaginatedResponse } from "@rental/types";
import {
  Button,
  Badge,
  Modal,
  ConfirmDialog,
  Table,
  PageHeader,
  StatCard,
  FormField,
  FilterBar,
  fieldClass,
  textareaClass,
} from "@rental/ui";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_META: Record<Maintenance["status"], { label: string; variant: "warning" | "info" | "success" }> = {
  REPORTED: { label: "Dilaporkan", variant: "warning" },
  IN_PROGRESS: { label: "Dalam perbaikan", variant: "info" },
  COMPLETED: { label: "Selesai", variant: "success" },
};

const EMPTY_FORM = {
  propertyId: "",
  description: "",
  status: "REPORTED" as Maintenance["status"],
};

export default function MaintenancePage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [maintData, propData] = await Promise.all([
        apiFetch<PaginatedResponse<Maintenance>>("/maintenances", { params: { limit: 100 } }),
        apiFetch<PaginatedResponse<Property>>("/properties", { params: { limit: 100 } }),
      ]);
      setMaintenances(maintData.data);
      setProperties(propData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const del = useConfirmDelete<Maintenance>("/maintenances", fetchData);

  const openCreate = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (m: Maintenance) => {
    setEditing(m);
    setFormData({ propertyId: String(m.propertyId), description: m.description, status: m.status });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      if (editing) {
        // Backend hanya menerima perubahan deskripsi dan status
        await apiFetch(`/maintenances/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ description: formData.description.trim(), status: formData.status }),
        });
      } else {
        await apiFetch("/maintenances", {
          method: "POST",
          body: JSON.stringify({
            propertyId: Number(formData.propertyId),
            description: formData.description.trim(),
            status: formData.status,
          }),
        });
      }
      setShowModal(false);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan laporan");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return maintenances.filter((m) => {
      const desc = m.description.toLowerCase();
      const code = m.property?.code?.toLowerCase() || "";
      return !term || desc.includes(term) || code.includes(term);
    });
  }, [maintenances, search]);

  const total = maintenances.length;
  const reportedCount = maintenances.filter((m) => m.status === "REPORTED").length;
  const inProgressCount = maintenances.filter((m) => m.status === "IN_PROGRESS").length;
  const completedCount = maintenances.filter((m) => m.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pemeliharaan & Servis"
        subtitle="Kelola laporan kerusakan unit, perbaikan, dan status penanganannya."
        actions={<Button onClick={openCreate}>+ Lapor Kerusakan Baru</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total laporan" value={total} secondary="Semua kendala" />
        <StatCard label="Dilaporkan" value={reportedCount} secondary="Menunggu tindakan" />
        <StatCard label="Dalam perbaikan" value={inProgressCount} secondary="Sedang dikerjakan" />
        <StatCard label="Selesai" value={completedCount} secondary="Sudah tuntas" />
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Cari deskripsi kendala atau kode unit...",
        }}
      />

      <Table<Maintenance>
        data={filtered}
        keyExtractor={(m) => m.id}
        loading={loading}
        emptyMessage={
          maintenances.length === 0
            ? "Belum ada laporan. Klik \"Lapor Kerusakan Baru\" untuk mencatat."
            : "Tidak ada laporan yang cocok."
        }
        columns={[
          {
            header: "Unit Properti",
            accessor: (m) => (
              <span className="font-medium text-ink text-sm">{m.property?.code || `#${m.propertyId}`}</span>
            ),
          },
          {
            header: "Deskripsi Kerusakan",
            accessor: (m) => (
              <span className="text-sm text-ink block max-w-md whitespace-normal">{m.description}</span>
            ),
          },
          {
            header: "Tanggal Lapor",
            accessor: (m) => <span className="text-sm text-ink-muted">{formatDate(m.reportedAt)}</span>,
          },
          {
            header: "Status",
            accessor: (m) => <Badge variant={STATUS_META[m.status].variant}>{STATUS_META[m.status].label}</Badge>,
          },
          {
            header: "Aksi",
            align: "right",
            accessor: (m) => (
              <div className="flex items-center justify-end gap-4">
                <Button variant="link-blue" className="text-sm font-medium" onClick={() => openEdit(m)}>
                  Edit
                </Button>
                <Button variant="link-red" className="text-sm font-medium" onClick={() => del.request(m)}>
                  Hapus
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        isOpen={showModal}
        onClose={() => !submitting && setShowModal(false)}
        title={editing ? "Edit Laporan Maintenance" : "Catat Laporan Maintenance"}
        description="Laporkan kerusakan atau kebutuhan perbaikan pada suatu unit."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Unit Properti"
            required
            helperText={editing ? "Unit tidak bisa diubah setelah laporan dibuat." : undefined}
          >
            <select
              className={fieldClass}
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
              disabled={!!editing}
              required
            >
              <option value="">Pilih unit properti</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Deskripsi kendala / perbaikan" required>
            <textarea
              rows={3}
              className={textareaClass}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Pipa kamar mandi bocor, keran patah..."
              required
            />
          </FormField>

          <FormField label="Status penanganan">
            <select
              className={fieldClass}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Maintenance["status"] })}
            >
              {Object.entries(STATUS_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </FormField>

          {formError && (
            <p role="alert" className="text-sm text-error bg-error-bg border border-error-border rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Laporan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!del.target}
        title="Hapus laporan maintenance?"
        message={
          del.target
            ? `Laporan untuk unit ${del.target.property?.code ?? `#${del.target.propertyId}`} akan dihapus permanen.`
            : ""
        }
        loading={del.busy}
        error={del.error}
        onConfirm={del.confirm}
        onCancel={del.cancel}
      />
    </div>
  );
}
