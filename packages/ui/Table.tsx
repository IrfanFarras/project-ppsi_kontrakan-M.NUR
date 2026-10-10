import React from "react";
import { SkeletonTable } from "./Skeleton";

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  align?: "left" | "center" | "right";
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  emptyState?: React.ReactNode;
  loading?: boolean;
  skeletonRows?: number;
}

const ALIGN: Record<NonNullable<Column<unknown>["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "Belum ada data.",
  emptyState,
  loading = false,
  skeletonRows = 5,
}: TableProps<T>) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-auto divide-y divide-border" style={{ fontFeatureSettings: '"tnum" 1' }}>
          <thead className="bg-surface-muted">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-4 py-2.5 text-xs font-medium text-ink-muted whitespace-nowrap ${ALIGN[col.align ?? "left"]} ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <SkeletonTable columns={columns.length} rows={skeletonRows} />
            ) : data.length > 0 ? (
              data.map((item) => (
                <tr key={keyExtractor(item)} className="hover:bg-surface-muted transition-colors">
                  {columns.map((col, colIndex) => {
                    let content: React.ReactNode = null;
                    if (typeof col.accessor === "function") {
                      content = col.accessor(item);
                    } else if (col.accessor) {
                      content = item[col.accessor] as unknown as React.ReactNode;
                    }

                    return (
                      <td
                        key={colIndex}
                        className={`px-4 py-2.5 whitespace-nowrap text-sm text-ink ${ALIGN[col.align ?? "left"]} ${col.className || ""}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {emptyState ?? (
                    <div className="text-center py-12 px-4 text-ink-muted text-sm">{emptyMessage}</div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
