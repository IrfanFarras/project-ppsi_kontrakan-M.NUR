"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useConfirmDelete } from "@/lib/useConfirmDelete";
import { Payment, Contract, PaginatedResponse } from "@rental/types";
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

const today = () => new Date().toISOString().split("T")[0];

const STATUS_META: Record<Payment["status"], { label: string; variant: "success" | "warning" | "danger" }> = {
  PAID: { label: "Lunas", variant: "success" },
  PARTIAL: { label: "Sebagian", variant: "warning" },
  LATE: { label: "Terlambat", variant: "danger" },
  UNPAID: { label: "Belum bayar", variant: "danger" },
};

const METHOD_LABEL: Record<NonNullable<Payment["method"]>, string> = {
  BANK_TRANSFER: "Transfer bank",
  CASH: "Tunai",
  E_WALLET: "E-wallet",
  OTHER: "Lainnya",
};

const EMPTY_FORM = {
  contractId: "",
  amount: "",
  paymentDate: today(),
  method: "BANK_TRANSFER" as NonNullable<Payment["method"]>,
  status: "PAID" as Payment["status"],
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payData, conData] = await Promise.all([
        apiFetch<PaginatedResponse<Payment>>("/payments", { params: { limit: 100 } }),
        apiFetch<PaginatedResponse<Contract>>("/contracts", { params: { limit: 100 } }),
      ]);
      setPayments(payData.data);
      setContracts(conData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const del = useConfirmDelete<Payment>("/payments", fetchData);

  const openCreate = () => {
    setEditing(null);
    setFormData({ ...EMPTY_FORM, paymentDate: today() });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (p: Payment) => {
    setEditing(p);
    setFormData({
      contractId: String(p.contractId),
      amount: String(Math.round(Number(p.amount))),
      paymentDate: p.paymentDate.split("T")[0],
      method: p.method ?? "OTHER",
      status: p.status,
    });
    setFormError("");
    setShowModal(true);
  };

  // Kontrak baru hanya dari yang aktif; saat edit, kontrak aslinya tetap muncul.
  const contractOptions = useMemo(
    () => contracts.filter((c) => c.status === "ACTIVE" || c.id === editing?.contractId),
    [contracts, editing]
  );

  const handleContractChange = (value: string) => {
    const contract = contracts.find((c) => String(c.id) === value);
    setFormData((prev) => ({
      ...prev,
      contractId: value,
      // Isi nominal otomatis dengan tarif kontrak jika masih kosong
      amount: prev.amount || (contract ? String(Math.round(Number(contract.rentAmount))) : ""),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const body = {
        amount: Number(formData.amount),
        paymentDate: formData.paymentDate,
        method: formData.method,
        status: formData.status,
      };
      if (editing) {
        await apiFetch(`/payments/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/payments", {
          method: "POST",
          body: JSON.stringify({ ...body, contractId: Number(formData.contractId) }),
        });
      }
      setShowModal(false);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan pembayaran");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((p) => {
      const unit = p.contract?.property?.code?.toLowerCase() || "";
      const tenant = p.contract?.tenant?.fullName?.toLowerCase() || "";
      return !term || unit.includes(term) || tenant.includes(term);
    });
  }, [payments, search]);

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidCount = payments.filter((p) => p.status === "PAID").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keuangan & Pembayaran"
        subtitle="Kelola arus kas masuk dan status tagihan sewa."
        actions={<Button onClick={openCreate}>+ Catat Pembayaran</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Total diterima" value={formatIDR(totalCollected)} secondary="Akumulasi kas masuk" />
        <StatCard label="Pembayaran lunas" value={paidCount} secondary="Berstatus lunas" />
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Cari kode unit atau nama penyewa...",
        }}
      />

      <Table<Payment>
        data={filtered}
        keyExtractor={(p) => p.id}
        loading={loading}
        emptyMessage={payments.length === 0 ? "Belum ada pembayaran. Klik \"Catat Pembayaran\" untuk menambah." : "Tidak ada pembayaran yang cocok."}
        columns={[
          {
            header: "Unit Properti",
            accessor: (p) => (
              <span className="font-medium text-ink text-sm">{p.contract?.property?.code || `#${p.contractId}`}</span>
            ),
          },
          {
            header: "Penyewa",
            accessor: (p) => <span className="text-sm text-ink">{p.contract?.tenant?.fullName || "-"}</span>,
          },
          {
            header: "Tanggal",
            accessor: (p) => <span className="text-sm text-ink-muted">{formatDate(p.paymentDate)}</span>,
          },
          {
            header: "Metode",
            accessor: (p) => (
              <span className="text-sm text-ink">{p.method ? METHOD_LABEL[p.method] : "Tidak disebutkan"}</span>
            ),
          },
          {
            header: "Nominal",
            align: "right",
            accessor: (p) => <span className="font-medium text-ink text-sm">{formatIDR(p.amount)}</span>,
          },
          {
            header: "Status",
            accessor: (p) => <Badge variant={STATUS_META[p.status].variant}>{STATUS_META[p.status].label}</Badge>,
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
        title={editing ? "Edit Pembayaran" : "Catat Pembayaran Sewa"}
        description="Masukkan data pembayaran sewa dari penyewa."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Kontrak (unit & penyewa)"
            required
            helperText={editing ? "Kontrak tidak bisa diubah. Hapus dan catat ulang bila salah kontrak." : undefined}
          >
            <select
              className={fieldClass}
              value={formData.contractId}
              onChange={(e) => handleContractChange(e.target.value)}
              disabled={!!editing}
              required
            >
              <option value="">Pilih kontrak aktif</option>
              {contractOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.property?.code} - {c.tenant?.fullName}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nominal (Rp)" required>
              <input
                type="number"
                min={1}
                className={fieldClass}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="2400000"
                required
              />
            </FormField>

            <FormField label="Tanggal pembayaran" required>
              <input
                type="date"
                className={fieldClass}
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Metode pembayaran">
              <select
                className={fieldClass}
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as typeof formData.method })}
              >
                {Object.entries(METHOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Status">
              <select
                className={fieldClass}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Payment["status"] })}
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
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Pembayaran"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!del.target}
        title="Hapus pembayaran?"
        message={
          del.target
            ? `Pembayaran ${formatIDR(del.target.amount)} untuk unit ${del.target.contract?.property?.code ?? `#${del.target.contractId}`} akan dihapus permanen.`
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
