import React from "react";

export interface StatCardProps {
  /** Nama metrik, satu baris pendek (mis. "Unit terisi"). */
  label: string;
  /** Angka/nilai utama. */
  value: React.ReactNode;
  /** Satuan kecil di samping nilai (mis. "unit", "kontrak"). */
  unit?: string;
  /** Keterangan satu baris di bawah nilai. */
  secondary?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

/**
 * Skala teks kartu (dipakai seragam di seluruh admin):
 * label 12px medium muted | nilai 24px semibold | satuan 14px muted | keterangan 12px muted.
 * Tidak ada teks di bawah 12px.
 */
export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, secondary, icon, badge }) => {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink-muted truncate">{label}</span>
        {badge ? (
          badge
        ) : icon ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-bg text-accent">
            {icon}
          </span>
        ) : null}
      </div>

      <div className="flex items-baseline gap-1.5 min-w-0">
        <span
          className="text-2xl font-semibold text-ink tracking-tight leading-8 truncate"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-ink-muted shrink-0">{unit}</span>}
      </div>

      {secondary && <div className="text-xs text-ink-muted leading-4 -mt-1">{secondary}</div>}
    </div>
  );
};
