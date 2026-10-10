"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useConfirmDelete } from "@/lib/useConfirmDelete";
import { Contract, Property, Tenant, PaginatedResponse } from "@rental/types";
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
} from "@rental/ui";

function formatIDR(value: number | string) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_META: Record<Contract["status"], { label: string; variant: "success" | "neutral" | "danger" | "info" }> = {
  ACTIVE: { label: "Aktif", variant: "success" },
  EXPIRED: { label: "Berakhir", variant: "neutral" },
  TERMINATED: { label: "Dibatalkan", variant: "danger" },
  RENEWED: { label: "Diperbarui", variant: "info" },
};

const STATUS_TABS: { value: "ALL" | Contract["status"]; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "EXPIRED", label: "Berakhir" },
  { value: "TERMINATED", label: "Dibatalkan" },
  { value: "RENEWED", label: "Diperbarui" },
];

const EMPTY_FORM = {
  propertyId: "",
  tenantId: "",
  startDate: "",
  endDate: "",
  rentAmount: "",
  status: "ACTIVE" as Contract["status"],
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | Contract["status"]>("ALL");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractsData, propertiesData, tenantsData] = await Promise.all([
        apiFetch<PaginatedResponse<Contract>>("/contracts", { params: { limit: 100 } }),
        apiFetch<PaginatedResponse<Property>>("/properties", { params: { limit: 100 } }),
        apiFetch<PaginatedResponse<Tenant>>("/tenants", { params: { limit: 100 } }),
      ]);
      setContracts(contractsData.data);
      setProperties(propertiesData.data);
      setTenants(tenantsData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const del = useConfirmDelete<Contract>("/contracts", fetchData);

  const openCreate = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (c: Contract) => {
    setEditing(c);
    setFormData({
      propertyId: String(c.propertyId),
      tenantId: String(c.tenantId),
      startDate: c.startDate.split("T")[0],
      endDate: c.endDate.split("T")[0],
      rentAmount: String(Math.round(Number(c.rentAmount))),
      status: c.status,
    });
    setFormError("");
    setShowModal(true);
  };

  // Mengisi tarif otomatis dari tarif unit saat membuat kontrak baru
  const handlePropertyChange = (value: string) => {
    const property = properties.find((p) => String(p.id) === value);
    setFormData((prev) => ({
      ...prev,
      propertyId: value,
      rentAmount:
        !editing && !prev.rentAmount && property && Number(property.rentAmount) > 0
          ? String(Math.round(Number(property.rentAmount)))
          : prev.rentAmount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.endDate <= formData.startDate) {
      setFormError("Tanggal berakhir harus setelah tanggal mulai.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const dates = { startDate: formData.startDate, endDate: formData.endDate };
      const rentAmount = Number(formData.rentAmount);

      if (editing) {
        // Unit dan penyewa tidak bisa diubah setelah kontrak dibuat (aturan backend)
        await apiFetch(`/contracts/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...dates, rentAmount, status: formData.status }),
        });
      } else {
        await apiFetch("/contracts", {
          method: "POST",
          body: JSON.stringify({
            ...dates,
            rentAmount,
            propertyId: Number(formData.propertyId),
            tenantId: Number(formData.tenantId),
          }),
        });
      }
      setShowModal(false);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan kontrak");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contracts.filter((c) => {
      const matchesStatus = statusTab === "ALL" || c.status === statusTab;
      const matchesSearch =
        !term ||
        c.property?.code.toLowerCase().includes(term) ||
        c.tenant?.fullName.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [contracts, search, statusTab]);

  const total = contracts.length;
  const activeCount = contracts.filter((c) => c.status === "ACTIVE").length;
  const endingSoonCount = contracts.filter(
    (c) => c.status === "ACTIVE" && new Date(c.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Kontrak"
        subtitle="Pantau masa berlaku, nilai sewa, dan status kontrak penyewa."
        actions={<Button onClick={openCreate}>+ Buat Kontrak Baru</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total kontrak" value={total} secondary="Semua periode" />
        <StatCard label="Kontrak aktif" value={activeCount} secondary="Sedang berjalan" />
        <StatCard label="Akan berakhir" value={endingSoonCount} secondary="Dalam 30 hari" />
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Cari kode unit atau nama penyewa...",
        }}
        tabs={STATUS_TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
          count: tab.value === "ALL" ? total : contracts.filter((c) => c.status === tab.value).length,
        }))}
        activeTab={statusTab}
        onTabChange={setStatusTab}
      />

      <Table<Contract>
        data={filtered}
        keyExtractor={(c) => c.id}
        loading={loading}
        emptyMessage={
          contracts.length === 0
            ? "Belum ada kontrak. Klik \"Buat Kontrak Baru\" atau setujui order masuk."
            : "Tidak ada kontrak yang cocok."
        }
        columns={[
          {
            header: "Unit Properti",
            accessor: (c) => (
              <span className="font-medium text-ink text-sm">{c.property?.code || `Unit #${c.propertyId}`}</span>
            ),
          },
          {
            header: "Penyewa",
            accessor: (c) => <span className="text-sm text-ink">{c.tenant?.fullName || `Penyewa #${c.tenantId}`}</span>,
          },
          {
            header: "Periode Sewa",
            accessor: (c) => (
              <div className="text-sm">
                <div className="text-ink">{formatDate(c.startDate)}</div>
                <div className="text-ink-muted text-xs">s/d {formatDate(c.endDate)}</div>
              </div>
            ),
          },
          {
            header: "Nilai Sewa",
            align: "right",
            accessor: (c) => <span className="font-medium text-ink text-sm">{formatIDR(c.rentAmount)}</span>,
          },
          {
            header: "Status",
            accessor: (c) => <Badge variant={STATUS_META[c.status].variant}>{STATUS_META[c.status].label}</Badge>,
          },
          {
            header: "Aksi",
            align: "right",
            accessor: (c) => (
              <div className="flex items-center justify-end gap-4">
                <Button variant="link-blue" className="text-sm font-medium" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                <Button variant="link-red" className="text-sm font-medium" onClick={() => del.request(c)}>
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
        title={editing ? "Edit Kontrak" : "Buat Kontrak Baru"}
        description="Tentukan unit, penyewa, masa berlaku, dan tarif sewa."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Unit Properti" required>
              <select
                className={fieldClass}
                value={formData.propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
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

            <FormField label="Penyewa" required>
              <select
                className={fieldClass}
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                disabled={!!editing}
                required
              >
                <option value="">Pilih penyewa</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {editing && (
            <p className="text-xs text-ink-muted -mt-2">
              Unit dan penyewa tidak bisa diubah setelah kontrak dibuat. Hapus dan buat ulang bila salah.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tanggal mulai" required>
              <input
                type="date"
                className={fieldClass}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Tanggal berakhir" required>
              <input
                type="date"
                className={fieldClass}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nilai sewa (Rp / bulan)" required>
              <input
                type="number"
                min={1}
                className={fieldClass}
                value={formData.rentAmount}
                onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                placeholder="1800000"
                required
              />
            </FormField>

            {editing && (
              <FormField label="Status kontrak">
                <select
                  className={fieldClass}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Contract["status"] })}
                >
                  {Object.entries(STATUS_META).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
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
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Kontrak"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!del.target}
        title="Hapus kontrak?"
        message={
          del.target
            ? `Kontrak unit ${del.target.property?.code ?? `#${del.target.propertyId}`} atas nama ${del.target.tenant?.fullName ?? `#${del.target.tenantId}`} akan dihapus permanen.`
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
