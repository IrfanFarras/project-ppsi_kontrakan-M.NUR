"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Order, Tenant, PaginatedResponse } from "@rental/types";
import {
  Button,
  Badge,
  Modal,
  Table,
  PageHeader,
  StatCard,
  FormField,
  FilterBar,
} from "@rental/ui";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatIDR(value: string | number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    Number(value)
  );
}

type OrderStatus = Order["status"];

const STATUS_META: Record<OrderStatus, { label: string; variant: "warning" | "success" | "danger" | "neutral" }> = {
  PENDING: { label: "Menunggu", variant: "warning" },
  APPROVED: { label: "Disetujui", variant: "success" },
  REJECTED: { label: "Ditolak", variant: "danger" },
  CANCELLED: { label: "Dibatalkan", variant: "neutral" },
};

const TABS: { key: "ALL" | OrderStatus; label: string }[] = [
  { key: "ALL", label: "Semua" },
  { key: "PENDING", label: "Menunggu" },
  { key: "APPROVED", label: "Disetujui" },
  { key: "REJECTED", label: "Ditolak" },
  { key: "CANCELLED", label: "Dibatalkan" },
];

const INPUT_CLASS =
  "h-10 px-3 bg-surface border border-border rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary w-full";

type PendingAction = { type: "approve" | "reject"; order: Order } | null;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ALL" | OrderStatus>("ALL");

  const [action, setAction] = useState<PendingAction>(null);
  const [identityNumber, setIdentityNumber] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const [orderRes, tenantRes] = await Promise.all([
        apiFetch<{ data: Order[] }>("/orders"),
        apiFetch<PaginatedResponse<Tenant>>("/tenants", { params: { limit: 100 } }),
      ]);
      setOrders(orderRes.data);
      setTenants(tenantRes.data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const knownEmails = useMemo(() => new Set(tenants.map((t) => t.email.toLowerCase())), [tenants]);

  const counts = useMemo(() => {
    const base: Record<"ALL" | OrderStatus, number> = {
      ALL: orders.length,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => {
      base[o.status] += 1;
    });
    return base;
  }, [orders]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab !== "ALL" && o.status !== tab) return false;
      if (!term) return true;
      return (
        o.tenantFullName.toLowerCase().includes(term) ||
        o.tenantEmail.toLowerCase().includes(term) ||
        o.tenantPhone.toLowerCase().includes(term) ||
        (o.property?.code?.toLowerCase() ?? "").includes(term)
      );
    });
  }, [orders, search, tab]);

  const needsIdentity = !!action && action.type === "approve" && !knownEmails.has(action.order.tenantEmail.toLowerCase());

  const openAction = (type: "approve" | "reject", order: Order) => {
    setIdentityNumber("");
    setReason("");
    setFormError("");
    setAction({ type, order });
  };

  const closeAction = () => {
    if (submitting) return;
    setAction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action) return;

    if (action.type === "approve" && needsIdentity && !identityNumber.trim()) {
      setFormError("Nomor identitas wajib diisi untuk penyewa baru.");
      return;
    }
    if (action.type === "reject" && !reason.trim()) {
      setFormError("Alasan penolakan wajib diisi.");
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      const body =
        action.type === "approve"
          ? { status: "APPROVED", ...(needsIdentity ? { identityNumber: identityNumber.trim() } : {}) }
          : { status: "REJECTED", rejectionReason: reason.trim() };

      await apiFetch(`/orders/${action.order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      setAction(null);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal memproses order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Masuk"
        subtitle="Tinjau pengajuan sewa dari calon penyewa, lalu setujui atau tolak."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Menunggu keputusan" value={counts.PENDING} secondary="Perlu ditinjau" />
        <StatCard label="Disetujui" value={counts.APPROVED} secondary="Sudah jadi kontrak" />
        <StatCard label="Ditolak" value={counts.REJECTED} secondary="Dengan alasan tercatat" />
        <StatCard label="Total order" value={counts.ALL} secondary="Semua status" />
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 text-sm text-error bg-error-bg border border-error-border rounded-lg px-4 py-3">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={fetchData}>
            Coba lagi
          </Button>
        </div>
      )}

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Cari nama, email, telepon, atau kode unit...",
        }}
        tabs={TABS.map((t) => ({ value: t.key, label: t.label, count: counts[t.key] }))}
        activeTab={tab}
        onTabChange={setTab}
      />

      <Table<Order>
        data={filtered}
        keyExtractor={(o) => o.id}
        loading={loading}
        emptyMessage={
          orders.length === 0
            ? "Belum ada order masuk. Order dari calon penyewa akan muncul di sini."
            : "Tidak ada order yang cocok dengan filter."
        }
        columns={[
          {
            header: "Calon Penyewa",
            accessor: (o) => (
              <div className="flex flex-col">
                <span className="font-medium text-ink text-sm">{o.tenantFullName}</span>
                <span className="text-xs text-ink-muted">
                  {o.tenantPhone} · {o.tenantEmail}
                </span>
              </div>
            ),
          },
          {
            header: "Unit",
            accessor: (o) => (
              <div className="flex flex-col">
                <span className="font-medium text-ink text-sm">{o.property?.code ?? `#${o.propertyId}`}</span>
                <span className="text-xs text-ink-muted">{o.property?.name ?? ""}</span>
              </div>
            ),
          },
          {
            header: "Periode Sewa",
            accessor: (o) => (
              <div className="text-sm">
                <div className="text-ink">{formatDate(o.requestedStartDate)}</div>
                <div className="text-xs text-ink-muted">s/d {formatDate(o.requestedEndDate)}</div>
              </div>
            ),
          },
          {
            header: "Tarif / Bulan",
            align: "right",
            accessor: (o) => <span className="font-medium text-ink text-sm">{formatIDR(o.rentAmountSnapshot)}</span>,
          },
          {
            header: "Status",
            accessor: (o) => (
              <div className="flex flex-col items-start gap-1">
                <Badge variant={STATUS_META[o.status].variant}>{STATUS_META[o.status].label}</Badge>
                {o.status === "REJECTED" && o.rejectionReason && (
                  <span className="text-xs text-ink-muted max-w-[200px] truncate" title={o.rejectionReason}>
                    {o.rejectionReason}
                  </span>
                )}
              </div>
            ),
          },
          {
            header: "Aksi",
            align: "right",
            accessor: (o) =>
              o.status === "PENDING" ? (
                <div className="flex items-center justify-end gap-4">
                  <Button variant="link-blue" className="text-sm font-medium" onClick={() => openAction("approve", o)}>
                    Setujui
                  </Button>
                  <Button variant="link-red" className="text-sm font-medium" onClick={() => openAction("reject", o)}>
                    Tolak
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-ink-faint">-</span>
              ),
          },
        ]}
      />

      <Modal
        isOpen={!!action}
        onClose={closeAction}
        title={action?.type === "approve" ? "Setujui Order" : "Tolak Order"}
        description={
          action?.type === "approve"
            ? "Kontrak aktif akan dibuat dan unit berubah menjadi Terisi."
            : "Alasan penolakan akan tersimpan pada order."
        }
      >
        {action && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <dl className="bg-surface-muted rounded-lg p-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-ink-muted">Penyewa</dt>
              <dd className="text-ink font-medium text-right">{action.order.tenantFullName}</dd>
              <dt className="text-ink-muted">Unit</dt>
              <dd className="text-ink font-medium text-right">{action.order.property?.code ?? `#${action.order.propertyId}`}</dd>
              <dt className="text-ink-muted">Periode</dt>
              <dd className="text-ink text-right">
                {formatDate(action.order.requestedStartDate)} – {formatDate(action.order.requestedEndDate)}
              </dd>
              <dt className="text-ink-muted">Tarif / bulan</dt>
              <dd className="text-ink font-medium text-right">{formatIDR(action.order.rentAmountSnapshot)}</dd>
            </dl>

            {action.type === "approve" && needsIdentity && (
              <FormField
                label="Nomor identitas (KTP)"
                required
                helperText="Penyewa ini belum terdaftar, jadi data identitasnya perlu diisi."
              >
                <input
                  className={INPUT_CLASS}
                  value={identityNumber}
                  onChange={(e) => setIdentityNumber(e.target.value)}
                  placeholder="16 digit nomor KTP"
                  inputMode="numeric"
                  required
                />
              </FormField>
            )}

            {action.type === "approve" && !needsIdentity && (
              <p className="text-sm text-ink-muted">Penyewa sudah terdaftar, data yang ada akan dipakai untuk kontrak baru.</p>
            )}

            {action.type === "reject" && (
              <FormField label="Alasan penolakan" required>
                <textarea
                  rows={3}
                  className="p-3 bg-surface border border-border rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: unit sudah dipesan pihak lain"
                  required
                />
              </FormField>
            )}

            {formError && (
              <p role="alert" className="text-sm text-error bg-error-bg border border-error-border rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
              <Button type="button" variant="secondary" onClick={closeAction} disabled={submitting}>
                Batal
              </Button>
              <Button type="submit" variant={action.type === "reject" ? "danger" : "primary"} disabled={submitting}>
                {submitting ? "Memproses..." : action.type === "approve" ? "Setujui & buat kontrak" : "Tolak order"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
