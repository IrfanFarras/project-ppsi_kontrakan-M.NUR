"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  MonthlyReport,
  Property,
  Contract,
  Maintenance,
  Expense,
  Parking,
  Order,
  Payment,
  PaginatedResponse,
} from "@rental/types";
import { Badge, Button, Skeleton } from "@rental/ui";

/* --------------------------------------------------------------------- */
/* Icons                                                                  */
/* --------------------------------------------------------------------- */

type IconProps = { className?: string };
const ic = "h-4 w-4";

const InboxIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <path d="M4 13.5 6.4 5.6A1.5 1.5 0 0 1 7.8 4.5h8.4a1.5 1.5 0 0 1 1.4 1.1L20 13.5" />
    <path d="M4 13.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-4.5h-4.2a1 1 0 0 0-.9.6 3.2 3.2 0 0 1-5.8 0 1 1 0 0 0-.9-.6H4Z" />
  </svg>
);
const WalletIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <rect x="3" y="6" width="18" height="13" rx="1.5" />
    <path d="M3 10h18" />
    <path d="M15 14.5h3" />
  </svg>
);
const FileSignatureIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <path d="M13 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V8l-4-5Z" />
    <path d="M13 3v5h4" />
  </svg>
);
const WrenchIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <path d="M14.7 6.3a4 4 0 0 0-5.4 4.6L4 16.2V20h3.8l5.3-5.3a4 4 0 0 0 4.6-5.4l-2.6 2.6-2-2 2.6-2.6Z" />
  </svg>
);
const ReceiptIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <path d="M6 3h12v18l-2.5-1.5L13 21l-1.5-1.5L10 21l-2.5-1.5L6 21V3Z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);
const ChevronRightIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const AlertIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
  </svg>
);

/* --------------------------------------------------------------------- */
/* Helpers                                                                */
/* --------------------------------------------------------------------- */

function formatIDR(value: number | string) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const DAY_MS = 24 * 60 * 60 * 1000;

const PROPERTY_STATUS_META: Record<Property["status"], { label: string; dot: string }> = {
  AVAILABLE: { label: "Tersedia", dot: "bg-success" },
  OCCUPIED: { label: "Terisi", dot: "bg-accent" },
  UNDER_MAINTENANCE: { label: "Pemeliharaan", dot: "bg-warning" },
  RESERVED: { label: "Dipesan", dot: "bg-accent/40" },
  INACTIVE: { label: "Nonaktif", dot: "bg-ink-faint" },
};

const PAYMENT_BADGE: Record<Payment["status"], { label: string; variant: "success" | "warning" | "danger" }> = {
  PAID: { label: "Lunas", variant: "success" },
  PARTIAL: { label: "Sebagian", variant: "warning" },
  LATE: { label: "Terlambat", variant: "danger" },
  UNPAID: { label: "Belum bayar", variant: "danger" },
};

function paymentBadge(status: string): { label: string; variant: "success" | "warning" | "danger" | "neutral" } {
  return PAYMENT_BADGE[status as Payment["status"]] ?? { label: status, variant: "neutral" };
}

const linkButtonBase =
  "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors";
const linkButtonPrimary = `${linkButtonBase} bg-primary text-primary-foreground hover:bg-accent-strong`;
const linkButtonSecondary = `${linkButtonBase} bg-surface text-ink border border-border-strong hover:bg-surface-muted`;

function Panel({
  title,
  subtitle,
  action,
  flush = false,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Tanpa padding isi, untuk daftar/tabel yang memenuhi lebar kartu. */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface border border-border rounded-xl">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

function PanelNote({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-4 text-sm text-ink-muted">{children}</p>;
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-accent hover:underline underline-offset-2 shrink-0">
      {children}
    </Link>
  );
}

/* --------------------------------------------------------------------- */
/* Page                                                                   */
/* --------------------------------------------------------------------- */

export default function AdminDashboard() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const [reportData, propertiesData, contractsData, maintenancesData, expensesData, parkingsData, ordersData] =
        await Promise.all([
          apiFetch<MonthlyReport>("/reports/monthly", { params: { year, month } }),
          apiFetch<PaginatedResponse<Property>>("/properties", { params: { limit: 100 } }),
          apiFetch<PaginatedResponse<Contract>>("/contracts", { params: { limit: 100 } }),
          apiFetch<PaginatedResponse<Maintenance>>("/maintenances", { params: { limit: 100 } }),
          apiFetch<PaginatedResponse<Expense>>("/expenses", { params: { limit: 100 } }),
          apiFetch<PaginatedResponse<Parking>>("/parkings", { params: { limit: 100 } }),
          apiFetch<{ data: Order[] }>("/orders"),
        ]);

      setReport(reportData);
      setProperties(propertiesData.data);
      setContracts(contractsData.data);
      setMaintenances(maintenancesData.data);
      setExpenses(expensesData.data);
      setParkings(parkingsData.data);
      setOrders(ordersData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ----------------------------- Loading ------------------------------ */

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-3 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ Error -------------------------------- */

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Ringkasan</h1>
        <div className="flex flex-col items-center text-center gap-3 bg-surface border border-error-border rounded-xl p-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-bg text-error">
            <AlertIcon />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Gagal memuat data dashboard</p>
            <p className="text-sm text-ink-muted mt-1">{error}</p>
          </div>
          <Button onClick={fetchData}>Coba lagi</Button>
        </div>
      </div>
    );
  }

  /* ------------------------------ Derived ------------------------------ */

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * DAY_MS);

  const totalProperties = properties.length;
  const occupiedCount = properties.filter((p) => p.status === "OCCUPIED").length;
  const occupancyPct = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;
  const statusCounts = (Object.keys(PROPERTY_STATUS_META) as Property["status"][]).map((status) => ({
    status,
    count: properties.filter((p) => p.status === status).length,
  }));

  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const unpaidContracts = report?.unpaidContracts ?? [];
  const openMaintenance = maintenances.filter((m) => m.status !== "COMPLETED").length;

  const endingSoon = contracts
    .filter((c) => c.status === "ACTIVE" && new Date(c.endDate) <= in30Days)
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  const totalIncome = report?.summary.totalIncome ?? 0;
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.expenseDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
  const netCashflow = totalIncome - totalExpenses;

  const parkingAssigned = parkings.filter((p) => p.tenantId).length;

  const recentPayments = (report?.payments ?? [])
    .slice()
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 6);

  const actionItems = [
    { href: "/admin/orders", label: "Order menunggu keputusan", hint: "Setujui atau tolak", count: pendingOrders, icon: InboxIcon },
    { href: "/admin/payments", label: "Sewa belum dibayar", hint: "Bulan ini", count: unpaidContracts.length, icon: WalletIcon },
    { href: "/admin/contracts", label: "Kontrak segera berakhir", hint: "Dalam 30 hari", count: endingSoon.length, icon: FileSignatureIcon },
    { href: "/admin/maintenance", label: "Perbaikan belum selesai", hint: "Dilaporkan atau sedang dikerjakan", count: openMaintenance, icon: WrenchIcon },
  ];
  const actionTotal = actionItems.reduce((sum, item) => sum + item.count, 0);

  /* ------------------------------- View --------------------------------- */

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Ringkasan</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {report?.period.monthName} {report?.period.year} · {totalProperties} unit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/expenses" className={linkButtonSecondary}>
            <ReceiptIcon />
            Catat pengeluaran
          </Link>
          <Link href="/admin/payments" className={linkButtonPrimary}>
            <WalletIcon />
            Catat pembayaran
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Kolom kiri: apa yang harus dikerjakan */}
        <div className="lg:col-span-2 space-y-6">
          <Panel
            title="Perlu tindakan"
            subtitle={actionTotal > 0 ? `${actionTotal} hal menunggu` : "Tidak ada yang tertunda"}
            flush
          >
            <ul className="divide-y divide-border">
              {actionItems.map((item) => {
                const Icon = item.icon;
                const active = item.count > 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted transition-colors"
                    >
                      <span
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          active ? "bg-warning-bg text-warning" : "bg-surface-muted text-ink-faint"
                        }`}
                      >
                        <Icon />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{item.label}</span>
                        <span className="block text-xs text-ink-muted">{active ? item.hint : "Tidak ada"}</span>
                      </span>
                      <span className={`text-sm font-semibold ${active ? "text-ink" : "text-ink-faint"}`}>
                        {item.count}
                      </span>
                      <ChevronRightIcon className="h-4 w-4 text-ink-faint" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel
            title="Kontrak segera berakhir"
            subtitle="Dalam 30 hari ke depan"
            action={endingSoon.length > 0 ? <PanelLink href="/admin/contracts">Lihat kontrak</PanelLink> : undefined}
            flush
          >
            {endingSoon.length === 0 ? (
              <PanelNote>Tidak ada kontrak yang berakhir dalam 30 hari.</PanelNote>
            ) : (
              <ul className="divide-y divide-border">
                {endingSoon.slice(0, 5).map((c) => {
                  const daysLeft = Math.max(0, Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / DAY_MS));
                  return (
                    <li key={c.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink">{c.property?.code ?? "-"}</div>
                        <div className="text-xs text-ink-muted truncate">{c.tenant?.fullName ?? "-"}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="warning">{daysLeft === 0 ? "Hari ini" : `${daysLeft} hari lagi`}</Badge>
                        <div className="text-xs text-ink-muted mt-1">{formatDate(c.endDate)}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel
            title="Hunian"
            subtitle={`${occupiedCount} dari ${totalProperties} unit terisi (${occupancyPct}%)`}
            action={<PanelLink href="/admin/properties">Kelola unit</PanelLink>}
          >
            {totalProperties === 0 ? (
              <p className="text-sm text-ink-muted">Belum ada unit. Tambahkan unit lewat menu Properties.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-subtle">
                  {statusCounts
                    .filter((s) => s.count > 0)
                    .map((s) => (
                      <div
                        key={s.status}
                        className={PROPERTY_STATUS_META[s.status].dot}
                        style={{ width: `${(s.count / totalProperties) * 100}%` }}
                        title={`${PROPERTY_STATUS_META[s.status].label}: ${s.count}`}
                      />
                    ))}
                </div>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {statusCounts.map((s) => (
                    <li key={s.status} className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${PROPERTY_STATUS_META[s.status].dot}`} />
                      <span className="text-ink-muted">{PROPERTY_STATUS_META[s.status].label}</span>
                      <span className="ml-auto font-medium text-ink">{s.count}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-ink-muted pt-3 border-t border-border">
                  Parkir: {parkingAssigned} dari {parkings.length} slot sudah punya penghuni
                </p>
              </div>
            )}
          </Panel>
        </div>

        {/* Kolom kanan: uang */}
        <div className="lg:col-span-3 space-y-6">
          <Panel title="Arus kas bulan ini" subtitle={`${report?.period.monthName} ${report?.period.year}`} flush>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="p-5">
                <div className="text-xs text-ink-muted">Pemasukan sewa</div>
                <div className="mt-1 text-xl font-semibold text-ink tracking-tight">{formatIDR(totalIncome)}</div>
                <div className="mt-1 text-xs text-ink-muted">{report?.payments.length ?? 0} pembayaran</div>
              </div>
              <div className="p-5">
                <div className="text-xs text-ink-muted">Pengeluaran</div>
                <div className="mt-1 text-xl font-semibold text-ink tracking-tight">{formatIDR(totalExpenses)}</div>
                <div className="mt-1 text-xs text-ink-muted">{monthExpenses.length} transaksi</div>
              </div>
              <div className="p-5">
                <div className="text-xs text-ink-muted">Bersih</div>
                <div
                  className={`mt-1 text-xl font-semibold tracking-tight ${netCashflow >= 0 ? "text-success" : "text-error"}`}
                >
                  {netCashflow >= 0 ? "+" : "-"}
                  {formatIDR(Math.abs(netCashflow))}
                </div>
                <div className="mt-1 text-xs text-ink-muted">Pemasukan dikurangi pengeluaran</div>
              </div>
            </div>
          </Panel>

          <Panel
            title="Belum membayar"
            subtitle={
              unpaidContracts.length > 0 ? `${unpaidContracts.length} kontrak belum membayar bulan ini` : undefined
            }
            action={<PanelLink href="/admin/payments">Catat pembayaran</PanelLink>}
            flush
          >
            {unpaidContracts.length === 0 ? (
              <PanelNote>Semua sewa bulan ini sudah dibayar.</PanelNote>
            ) : (
              <ul className="divide-y divide-border">
                {unpaidContracts.map((contract) => (
                  <li key={contract.contractId} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{contract.tenant.fullName}</div>
                      <div className="text-xs text-ink-muted truncate">
                        {contract.property.code} · {contract.tenant.phone}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium text-ink">{formatIDR(contract.rentAmount)}</div>
                      {contract.estimatedLateFee > 0 && (
                        <div className="text-xs text-error mt-0.5">+ denda {formatIDR(contract.estimatedLateFee)}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Pembayaran terbaru"
            action={recentPayments.length > 0 ? <PanelLink href="/admin/payments">Semua pembayaran</PanelLink> : undefined}
            flush
          >
            {recentPayments.length === 0 ? (
              <PanelNote>Belum ada pembayaran tercatat bulan ini.</PanelNote>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ fontFeatureSettings: '"tnum" 1' }}>
                  <thead>
                    <tr className="bg-surface-muted text-ink-muted text-xs">
                      <th className="py-2 px-5 font-medium">Unit / Penyewa</th>
                      <th className="py-2 px-5 font-medium">Tanggal</th>
                      <th className="py-2 px-5 font-medium text-right">Nominal</th>
                      <th className="py-2 px-5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-muted transition-colors">
                        <td className="py-2.5 px-5 whitespace-nowrap">
                          <div className="font-medium text-ink text-sm">{p.contract.property.code}</div>
                          <div className="text-xs text-ink-muted">{p.contract.tenant.fullName}</div>
                        </td>
                        <td className="py-2.5 px-5 text-sm text-ink-muted whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                        <td className="py-2.5 px-5 text-right text-sm font-medium text-ink whitespace-nowrap">
                          {formatIDR(p.amount)}
                        </td>
                        <td className="py-2.5 px-5">
                          <Badge variant={paymentBadge(p.status).variant}>{paymentBadge(p.status).label}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
