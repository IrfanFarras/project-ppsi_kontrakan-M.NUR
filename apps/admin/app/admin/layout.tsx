"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Order } from "@rental/types";

interface AdminLayoutProps {
  children: ReactNode;
}

type IconProps = { className?: string };
const ic = "h-[18px] w-[18px]";

const GridIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <rect x="4" y="4" width="7" height="7" rx="1" />
    <rect x="13" y="4" width="7" height="7" rx="1" />
    <rect x="4" y="13" width="7" height="7" rx="1" />
    <rect x="13" y="13" width="7" height="7" rx="1" />
  </svg>
);

const BuildingIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M10 21v-3.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V21" />
  </svg>
);

const UsersIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M15 20a4.5 4.5 0 0 1 6-4.24" />
  </svg>
);

const FileSignatureIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <path d="M13 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V8l-4-5Z" />
    <path d="M13 3v5h4" />
    <path d="M8 15.5c1-1 1.6-1.6 2.1-2.1.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4-.5.5-1.1 1.1-2.1 2.1H8v-1.4Z" />
  </svg>
);

const WalletIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <rect x="3" y="6" width="18" height="13" rx="1.5" />
    <path d="M3 10h18" />
    <path d="M15 14.5h3" />
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

const CarIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <path d="M4 16V11l1.8-4.2A1.5 1.5 0 0 1 7.2 6h9.6a1.5 1.5 0 0 1 1.4.8L20 11v5" />
    <rect x="3" y="13" width="18" height="5" rx="1.2" />
    <circle cx="7.5" cy="18.5" r="1.4" />
    <circle cx="16.5" cy="18.5" r="1.4" />
  </svg>
);

const InboxIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <path d="M4 13.5 6.4 5.6A1.5 1.5 0 0 1 7.8 4.5h8.4a1.5 1.5 0 0 1 1.4 1.1L20 13.5" />
    <path d="M4 13.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-4.5h-4.2a1 1 0 0 0-.9.6 3.2 3.2 0 0 1-5.8 0 1 1 0 0 0-.9-.6H4Z" />
  </svg>
);

const LogoutIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" />
    <path d="M13.5 16 18 12l-4.5-4M18 12H9" />
  </svg>
);

const PanelIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M9.5 4.5v15" />
  </svg>
);

const MenuIcon = ({ className = ic }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const ChevronDownIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const SIDEBAR_KEY = "admin.sidebar";

type NavItem = { href: string; label: string; icon: (p: IconProps) => ReactNode };

// Dikelompokkan menurut kerja harian: operasional, keuangan, fasilitas.
const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Operasional",
    items: [
      { href: "/admin", label: "Dashboard", icon: GridIcon },
      { href: "/admin/orders", label: "Orders", icon: InboxIcon },
      { href: "/admin/properties", label: "Properties", icon: BuildingIcon },
      { href: "/admin/tenants", label: "Tenants", icon: UsersIcon },
      { href: "/admin/contracts", label: "Contracts", icon: FileSignatureIcon },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { href: "/admin/payments", label: "Payments", icon: WalletIcon },
      { href: "/admin/expenses", label: "Expenses", icon: ReceiptIcon },
    ],
  },
  {
    label: "Fasilitas",
    items: [
      { href: "/admin/maintenance", label: "Maintenance", icon: WrenchIcon },
      { href: "/admin/parking", label: "Parking", icon: CarIcon },
    ],
  },
];

const allNavItems = navGroups.flatMap((g) => g.items);

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false); // hanya berlaku di layar lebar (lg+)
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Pulihkan pilihan sidebar terakhir (setelah mount, agar tidak mismatch hydration)
  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_KEY) === "collapsed") setCollapsed(true);
    } catch {
      /* storage tidak tersedia: abaikan */
    }
  }, []);

  // Tutup drawer dan menu pengguna setiap pindah halaman
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Jumlah order yang menunggu keputusan, untuk penanda di menu Orders
  useEffect(() => {
    let cancelled = false;
    apiFetch<{ data: Order[] }>("/orders")
      .then((res) => {
        if (!cancelled) setPendingOrders(res.data.filter((o) => o.status === "PENDING").length);
      })
      .catch(() => {
        /* penanda bersifat tambahan: abaikan jika gagal */
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Esc menutup drawer/menu; klik di luar menu pengguna menutupnya
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMenuOpen(false);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_KEY, next ? "collapsed" : "expanded");
    } catch {
      /* storage tidak tersedia: abaikan */
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === href;
    return pathname?.startsWith(href);
  };

  const currentLabel = allNavItems.find((item) => isActive(item.href))?.label ?? "Admin";
  const userName = session?.user?.name || session?.user?.email || "Admin";

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:bg-surface focus:text-ink focus:px-3 focus:py-2 focus:rounded-lg focus:border focus:border-border"
      >
        Lewati ke konten
      </a>

      {/* Overlay drawer (layar kecil) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar: drawer di layar kecil, rel tetap di layar lebar */}
      <aside
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-50 w-64 ${
          collapsed ? "lg:w-16" : "lg:w-64"
        } flex flex-col bg-surface border-r border-border transition-[transform,width] duration-200 motion-reduce:transition-none lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className={`h-14 shrink-0 flex items-center gap-2.5 border-b border-border px-4 ${
            collapsed ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
            KM
          </div>
          <span className={`text-sm font-semibold text-ink truncate ${collapsed ? "lg:hidden" : ""}`}>
            Kontrakan M. Nur
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
              <div className={`px-3 pb-1 text-xs font-medium text-ink-faint ${collapsed ? "lg:hidden" : ""}`}>
                {group.label}
              </div>
              {collapsed && gi > 0 && <div className="hidden lg:block mx-2 mb-2 h-px bg-border" />}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  const badge = item.href === "/admin/orders" ? pendingOrders : 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors ${
                        collapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""
                      } ${
                        active
                          ? "bg-accent-bg text-accent font-semibold"
                          : "text-ink-muted font-medium hover:bg-surface-muted hover:text-ink"
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-accent" : "text-ink-faint"}`} />
                      <span className={collapsed ? "lg:sr-only" : undefined}>{item.label}</span>
                      {badge > 0 && (
                        <>
                          <span
                            className={`ml-auto min-w-5 h-5 px-1.5 rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center ${
                              collapsed ? "lg:hidden" : ""
                            }`}
                          >
                            {badge}
                          </span>
                          {collapsed && (
                            <span className="hidden lg:block absolute top-1.5 right-2 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Topbar */}
      <header
        className={`fixed top-0 right-0 left-0 ${
          collapsed ? "lg:left-16" : "lg:left-64"
        } h-14 z-30 bg-surface border-b border-border px-3 sm:px-4 lg:px-6 flex items-center justify-between transition-[left] duration-200 motion-reduce:transition-none`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
            aria-expanded={mobileOpen}
            className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors"
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors"
          >
            <PanelIcon />
          </button>
          <span className="lg:hidden text-sm font-semibold text-ink truncate">{currentLabel}</span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 h-9 pl-1 pr-1.5 sm:pr-2 rounded-lg hover:bg-surface-muted transition-colors"
          >
            <span className="h-7 w-7 rounded-full bg-accent-bg flex items-center justify-center text-xs font-semibold text-accent shrink-0">
              {userName.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:block text-sm font-medium text-ink max-w-[160px] truncate">{userName}</span>
            <ChevronDownIcon className="hidden sm:block h-4 w-4 text-ink-faint" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 bg-surface border border-border rounded-xl shadow-lg py-1"
            >
              <div className="px-3 py-2 border-b border-border">
                <div className="text-sm font-medium text-ink truncate">{userName}</div>
                <div className="text-xs text-ink-muted">Owner</div>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors"
              >
                <LogoutIcon className="h-4 w-4 text-ink-faint" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main
        id="main"
        className={`${
          collapsed ? "lg:ml-16" : "lg:ml-64"
        } pt-14 min-h-screen transition-[margin] duration-200 motion-reduce:transition-none`}
      >
        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6 max-w-[1360px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
