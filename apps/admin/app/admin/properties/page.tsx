"use client";

import { useMemo, useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useConfirmDelete } from "@/lib/useConfirmDelete";
import { Property, PaginatedResponse } from "@rental/types";
import {
  Button,
  Badge,
  Modal,
  ConfirmDialog,
  Table,
  PageHeader,
  FilterBar,
  StatCard,
  FormField,
  fieldClass,
  textareaClass,
} from "@rental/ui";

const STATUS_META: Record<Property["status"], { label: string; badge: "success" | "neutral" | "warning" | "info" }> = {
  AVAILABLE: { label: "Tersedia", badge: "info" },
  OCCUPIED: { label: "Terisi", badge: "success" },
  UNDER_MAINTENANCE: { label: "Pemeliharaan", badge: "warning" },
  RESERVED: { label: "Dipesan", badge: "info" },
  INACTIVE: { label: "Nonaktif", badge: "neutral" },
};

const STATUS_TABS: { value: "ALL" | Property["status"]; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "OCCUPIED", label: "Terisi" },
  { value: "AVAILABLE", label: "Tersedia" },
  { value: "UNDER_MAINTENANCE", label: "Pemeliharaan" },
  { value: "RESERVED", label: "Dipesan" },
  { value: "INACTIVE", label: "Nonaktif" },
];

function formatIDR(value: number | string) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}

const EMPTY_FORM = {
  code: "",
  name: "",
  address: "",
  rentAmount: "",
  status: "AVAILABLE" as Property["status"],
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | Property["status"]>("ALL");

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const data = await apiFetch<PaginatedResponse<Property>>("/properties", { params: { limit: 100 } });
      setProperties(data.data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat properti");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const del = useConfirmDelete<Property>("/properties", fetchProperties);

  const openCreate = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (p: Property) => {
    setEditing(p);
    setFormData({
      code: p.code,
      name: p.name,
      address: p.address,
      rentAmount: Number(p.rentAmount) > 0 ? String(Math.round(Number(p.rentAmount))) : "",
      status: p.status,
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
        code: formData.code.trim(),
        name: formData.name.trim(),
        address: formData.address.trim(),
        rentAmount: formData.rentAmount ? Number(formData.rentAmount) : 0,
        status: formData.status,
      };
      if (editing) {
        await apiFetch(`/properties/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/properties", { method: "POST", body: JSON.stringify(body) });
      }
      setShowModal(false);
      await fetchProperties();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan properti");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return properties.filter((p) => {
      const activeContract = p.contracts?.[0];
      const matchesStatus = statusTab === "ALL" || p.status === statusTab;
      const matchesSearch =
        !term ||
        p.code.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        p.address.toLowerCase().includes(term) ||
        activeContract?.tenant?.fullName.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [properties, search, statusTab]);

  const total = properties.length;
  const occupiedCount = properties.filter((p) => p.status === "OCCUPIED").length;
  const availableCount = properties.filter((p) => p.status === "AVAILABLE").length;
  const maintenanceCount = properties.filter((p) => p.status === "UNDER_MAINTENANCE").length;
  const noRentCount = properties.filter((p) => !(Number(p.rentAmount) > 0)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Properti"
        subtitle="Kelola unit sewa, tarif bulanan, dan status hunian."
        actions={<Button onClick={openCreate}>+ Tambah Properti Baru</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total unit" value={total} secondary="Seluruh unit terdaftar" />
        <StatCard
          label="Unit terisi"
          value={occupiedCount}
          secondary={`${total > 0 ? Math.round((occupiedCount / total) * 100) : 0}% okupansi`}
        />
        <StatCard label="Unit tersedia" value={availableCount} secondary="Siap huni" />
        <StatCard label="Dalam pemeliharaan" value={maintenanceCount} secondary="Belum bisa disewakan" />
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 text-sm text-error bg-error-bg border border-error-border rounded-lg px-4 py-3"
        >
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={fetchProperties}>
            Coba lagi
          </Button>
        </div>
      )}

      {!loading && noRentCount > 0 && (
        <p className="text-sm text-ink-muted bg-surface-muted border border-border rounded-lg px-4 py-3">
          {noRentCount} unit belum punya tarif sewa. Order untuk unit tanpa tarif tidak bisa disetujui. Klik Edit untuk mengisinya.
        </p>
      )}

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Cari kode unit, nama, alamat, atau nama penyewa...",
        }}
        tabs={STATUS_TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
          count: tab.value === "ALL" ? total : properties.filter((p) => p.status === tab.value).length,
        }))}
        activeTab={statusTab}
        onTabChange={setStatusTab}
      />

      <Table<Property>
        data={filtered}
        keyExtractor={(p) => p.id}
        loading={loading}
        emptyMessage={
          properties.length === 0
            ? "Belum ada properti. Klik \"Tambah Properti Baru\" untuk memulai."
            : "Tidak ada properti yang cocok."
        }
        columns={[
          {
            header: "Kode & Nama Properti",
            accessor: (p) => (
              <div className="flex flex-col">
                <span className="font-medium text-ink text-sm">{p.name}</span>
                <span className="text-xs text-ink-muted">{p.code}</span>
              </div>
            ),
          },
          {
            header: "Alamat / Lokasi",
            accessor: (p) => <span className="text-ink-muted text-sm">{p.address}</span>,
          },
          {
            header: "Status Hunian",
            accessor: (p) => (
              <Badge variant={STATUS_META[p.status]?.badge || "neutral"}>
                {STATUS_META[p.status]?.label || p.status}
              </Badge>
            ),
          },
          {
            header: "Penyewa Aktif",
            accessor: (p) => {
              const contract = p.contracts?.[0];
              if (!contract || !contract.tenant) {
                return <span className="text-ink-faint text-xs">Siap huni</span>;
              }
              return (
                <div className="flex flex-col">
                  <span className="font-medium text-ink text-sm">{contract.tenant.fullName}</span>
                  <span className="text-xs text-ink-muted">{contract.tenant.phone}</span>
                </div>
              );
            },
          },
          {
            header: "Tarif Sewa",
            align: "right",
            accessor: (p) =>
              Number(p.rentAmount) > 0 ? (
                <div className="flex flex-col items-end">
                  <span className="font-medium text-ink text-sm">{formatIDR(p.rentAmount)}</span>
                  <span className="text-xs text-ink-muted">/ bulan</span>
                </div>
              ) : (
                <span className="text-xs text-warning">Belum diatur</span>
              ),
          },
          {
            header: "Aksi",
            align: "right",
            accessor: (p) => (
              <div className="flex items-center justify-end gap-4">
                <Button variant="link-blue" className="text-sm font-medium" onClick={() => openEdit(p)}>
                  Edit
                </Button>
                <Button variant="link-red" className="text-sm font-medium" onClick={() => del.request(p)}>
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
        title={editing ? "Edit Properti" : "Tambah Properti Baru"}
        description="Lengkapi detail properti, tarif, dan status operasional."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Kode unit" required>
              <input
                type="text"
                required
                maxLength={50}
                placeholder="Contoh: A1, B1"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className={fieldClass}
              />
            </FormField>

            <FormField label="Nama properti" required>
              <input
                type="text"
                required
                maxLength={255}
                placeholder="Contoh: Rumah Tipe A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={fieldClass}
              />
            </FormField>
          </div>

          <FormField label="Alamat / deskripsi fisik" required>
            <textarea
              required
              rows={3}
              placeholder="Alamat lengkap, dimensi bangunan, atau keterangan..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={textareaClass}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Tarif sewa (Rp / bulan)"
              helperText="Dipakai sebagai harga pada order baru. Wajib lebih dari 0 agar order bisa disetujui."
            >
              <input
                type="number"
                min={0}
                placeholder="1800000"
                value={formData.rentAmount}
                onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                className={fieldClass}
              />
            </FormField>

            <FormField label="Status hunian">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Property["status"] })}
                className={fieldClass}
              >
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

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
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Properti"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!del.target}
        title="Hapus properti?"
        message={
          del.target
            ? `Unit ${del.target.code} (${del.target.name}) akan dihapus permanen. Unit dengan kontrak aktif tidak bisa dihapus.`
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
