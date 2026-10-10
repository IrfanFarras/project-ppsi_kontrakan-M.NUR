"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useConfirmDelete } from "@/lib/useConfirmDelete";
import { Parking, Property, Tenant, PaginatedResponse } from "@rental/types";
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

const VEHICLE_SUGGESTIONS = ["Mobil", "Motor", "Sepeda"];

const EMPTY_FORM = { propertyId: "", tenantId: "", vehicleType: "", plateNumber: "" };

export default function ParkingPage() {
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Parking | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [parkData, propData, tenantData] = await Promise.all([
        apiFetch<PaginatedResponse<Parking>>("/parkings", { params: { limit: 100 } }),
        apiFetch<PaginatedResponse<Property>>("/properties", { params: { limit: 100 } }),
        apiFetch<PaginatedResponse<Tenant>>("/tenants", { params: { limit: 100 } }),
      ]);
      setParkings(parkData.data);
      setProperties(propData.data);
      setTenants(tenantData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const del = useConfirmDelete<Parking>("/parkings", fetchData);

  const openCreate = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (p: Parking) => {
    setEditing(p);
    setFormData({
      propertyId: p.propertyId ? String(p.propertyId) : "",
      tenantId: p.tenantId ? String(p.tenantId) : "",
      vehicleType: p.vehicleType ?? "",
      plateNumber: p.plateNumber ?? "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Aturan backend: slot parkir harus terhubung ke unit dan/atau penyewa
    if (!formData.propertyId && !formData.tenantId) {
      setFormError("Pilih minimal salah satu: unit properti atau penyewa.");
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      const vehicleType = formData.vehicleType.trim();
      const plateNumber = formData.plateNumber.trim();

      if (editing) {
        // null = kosongkan field (backend mengizinkan null saat update)
        await apiFetch(`/parkings/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({
            propertyId: formData.propertyId ? Number(formData.propertyId) : null,
            tenantId: formData.tenantId ? Number(formData.tenantId) : null,
            vehicleType: vehicleType || null,
            plateNumber: plateNumber || null,
          }),
        });
      } else {
        await apiFetch("/parkings", {
          method: "POST",
          body: JSON.stringify({
            ...(formData.propertyId && { propertyId: Number(formData.propertyId) }),
            ...(formData.tenantId && { tenantId: Number(formData.tenantId) }),
            ...(vehicleType && { vehicleType }),
            ...(plateNumber && { plateNumber }),
          }),
        });
      }
      setShowModal(false);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan slot parkir");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return parkings.filter((p) => {
      const plate = p.plateNumber?.toLowerCase() || "";
      const tenant = p.tenant?.fullName?.toLowerCase() || "";
      const unit = p.property?.code?.toLowerCase() || "";
      return !term || plate.includes(term) || tenant.includes(term) || unit.includes(term);
    });
  }, [parkings, search]);

  const total = parkings.length;
  const occupiedCount = parkings.filter((p) => p.tenantId).length;
  const availableCount = total - occupiedCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fasilitas & Slot Parkir"
        subtitle="Kelola slot parkir, nomor polisi kendaraan, dan penghuni terkait."
        actions={<Button onClick={openCreate}>+ Tambah Slot Parkir</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total slot" value={total} secondary="Kapasitas area parkir" />
        <StatCard label="Slot terisi" value={occupiedCount} secondary="Dipakai penghuni" />
        <StatCard label="Slot tersedia" value={availableCount} secondary="Belum punya penyewa" />
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Cari nomor plat, penyewa, atau unit...",
        }}
      />

      <Table<Parking>
        data={filtered}
        keyExtractor={(p) => p.id}
        loading={loading}
        emptyMessage={
          parkings.length === 0
            ? "Belum ada slot parkir. Klik \"Tambah Slot Parkir\" untuk menambah."
            : "Tidak ada slot yang cocok."
        }
        columns={[
          {
            header: "Nomor Polisi",
            accessor: (p) => <span className="font-medium text-ink text-sm">{p.plateNumber || "-"}</span>,
          },
          {
            header: "Jenis Kendaraan",
            accessor: (p) => <span className="text-sm text-ink">{p.vehicleType || "-"}</span>,
          },
          {
            header: "Unit Properti",
            accessor: (p) => <span className="text-sm text-ink">{p.property?.code || "-"}</span>,
          },
          {
            header: "Penyewa / Pemilik",
            accessor: (p) =>
              p.tenant?.fullName ? (
                <span className="text-sm text-ink">{p.tenant.fullName}</span>
              ) : (
                <span className="text-xs text-ink-faint">Belum dialokasikan</span>
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
        title={editing ? "Edit Slot Parkir" : "Tambah Slot Parkir"}
        description="Hubungkan slot dengan unit properti dan/atau penyewa."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Unit Properti" helperText="Isi unit, penyewa, atau keduanya.">
              <select
                className={fieldClass}
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
              >
                <option value="">Tidak dipilih</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Penyewa">
              <select
                className={fieldClass}
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              >
                <option value="">Tidak dipilih</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Jenis kendaraan">
              <input
                type="text"
                list="vehicle-types"
                className={fieldClass}
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                placeholder="Mobil / Motor"
                maxLength={50}
              />
              <datalist id="vehicle-types">
                {VEHICLE_SUGGESTIONS.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Nomor polisi">
              <input
                type="text"
                className={fieldClass}
                value={formData.plateNumber}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                placeholder="B 1234 XYZ"
                maxLength={20}
              />
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
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Slot"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!del.target}
        title="Hapus slot parkir?"
        message={
          del.target
            ? `Slot ${del.target.plateNumber ? `dengan plat ${del.target.plateNumber}` : `#${del.target.id}`} akan dihapus permanen.`
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
