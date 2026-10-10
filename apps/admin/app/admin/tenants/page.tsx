"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useConfirmDelete } from "@/lib/useConfirmDelete";
import { Tenant, PaginatedResponse } from "@rental/types";
import {
  Button,
  Modal,
  ConfirmDialog,
  Table,
  PageHeader,
  StatCard,
  FormField,
  FilterBar,
  fieldClass,
} from "@rental/ui";

const EMPTY_FORM = { fullName: "", phone: "", email: "", identityNumber: "" };

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<PaginatedResponse<Tenant>>("/tenants", { params: { limit: 100 } });
      setTenants(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const del = useConfirmDelete<Tenant>("/tenants", fetchData);

  const openCreate = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (t: Tenant) => {
    setEditing(t);
    setFormData({
      fullName: t.fullName,
      phone: t.phone,
      email: t.email || "",
      identityNumber: t.identityNumber || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const body = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        identityNumber: formData.identityNumber.trim(),
      };
      if (editing) {
        await apiFetch(`/tenants/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/tenants", { method: "POST", body: JSON.stringify(body) });
      }
      setShowModal(false);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan penyewa");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tenants.filter(
      (t) =>
        !term ||
        t.fullName.toLowerCase().includes(term) ||
        t.phone.toLowerCase().includes(term) ||
        (t.email && t.email.toLowerCase().includes(term)) ||
        (t.identityNumber && t.identityNumber.toLowerCase().includes(term))
    );
  }, [tenants, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Penyewa"
        subtitle="Kelola identitas penyewa, data kontak, dan riwayat hunian."
        actions={<Button onClick={openCreate}>+ Tambah Penyewa Baru</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Penyewa terdaftar" value={tenants.length} secondary="Penghuni aktif dan riwayat" />
        <StatCard
          label="Identitas terisi"
          value={tenants.filter((t) => t.identityNumber).length}
          secondary="Penyewa dengan nomor KTP"
        />
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Cari nama, telepon, email, atau nomor identitas...",
        }}
      />

      <Table<Tenant>
        data={filtered}
        keyExtractor={(t) => t.id}
        loading={loading}
        emptyMessage={
          tenants.length === 0
            ? "Belum ada penyewa. Klik \"Tambah Penyewa Baru\" atau setujui order masuk."
            : "Tidak ada penyewa yang cocok."
        }
        columns={[
          {
            header: "Nama Lengkap",
            accessor: (t) => (
              <div className="flex flex-col">
                <span className="font-medium text-ink text-sm">{t.fullName}</span>
                <span className="text-xs text-ink-muted">{t.phone}</span>
              </div>
            ),
          },
          {
            header: "Email",
            accessor: (t) => <span className="text-sm text-ink-muted">{t.email || "—"}</span>,
          },
          {
            header: "No. KTP / Identitas",
            accessor: (t) => <span className="text-sm text-ink">{t.identityNumber || "—"}</span>,
          },
          {
            header: "Aksi",
            align: "right",
            accessor: (t) => (
              <div className="flex items-center justify-end gap-4">
                <Button variant="link-blue" className="text-sm font-medium" onClick={() => openEdit(t)}>
                  Edit
                </Button>
                <Button variant="link-red" className="text-sm font-medium" onClick={() => del.request(t)}>
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
        title={editing ? "Edit Data Penyewa" : "Tambah Penyewa Baru"}
        description="Lengkapi informasi kontak dan identitas penyewa."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nama lengkap" required>
            <input
              type="text"
              className={fieldClass}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Contoh: Budi Santoso"
              maxLength={255}
              required
            />
          </FormField>

          <FormField label="Nomor telepon (WhatsApp)" required>
            <input
              type="tel"
              className={fieldClass}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Contoh: 081234567890"
              maxLength={50}
              required
            />
          </FormField>

          <FormField label="Email" required>
            <input
              type="email"
              className={fieldClass}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="budi@example.com"
              required
            />
          </FormField>

          <FormField label="Nomor identitas (KTP)" required>
            <input
              type="text"
              inputMode="numeric"
              className={fieldClass}
              value={formData.identityNumber}
              onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
              placeholder="16 digit nomor KTP"
              maxLength={50}
              required
            />
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
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Penyewa"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!del.target}
        title="Hapus penyewa?"
        message={
          del.target
            ? `Data ${del.target.fullName} akan dihapus permanen. Penyewa yang masih punya kontrak mungkin tidak bisa dihapus.`
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
