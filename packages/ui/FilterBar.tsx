import React from "react";
import { SearchInput } from "./SearchInput";

export interface FilterTab<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

export interface FilterBarProps<T extends string = string> {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  tabs?: FilterTab<T>[];
  activeTab?: T;
  onTabChange?: (value: T) => void;
  /** Slot kanan di baris pencarian (mis. tombol ekspor). */
  children?: React.ReactNode;
}

/**
 * Bilah filter standar di atas tabel: pencarian + (opsional) tab status.
 * Satu komponen untuk semua halaman agar tinggi, jarak, dan gaya tab seragam.
 */
export function FilterBar<T extends string = string>({
  search,
  tabs,
  activeTab,
  onTabChange,
  children,
}: FilterBarProps<T>) {
  return (
    <div className="bg-surface border border-border rounded-xl">
      {(search || children) && (
        <div className="p-3 flex items-center gap-3">
          {search && (
            <SearchInput
              containerClassName="flex-1 sm:max-w-md"
              placeholder={search.placeholder}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              aria-label={search.placeholder ?? "Cari"}
            />
          )}
          {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
        </div>
      )}

      {tabs && tabs.length > 0 && (
        <div
          role="tablist"
          className={`flex items-center gap-1 overflow-x-auto px-3 ${search || children ? "border-t border-border" : ""}`}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange?.(tab.value)}
                className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "text-accent" : "text-ink-muted hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`text-xs ${active ? "text-accent" : "text-ink-faint"}`}>{tab.count}</span>
                  )}
                </span>
                {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
