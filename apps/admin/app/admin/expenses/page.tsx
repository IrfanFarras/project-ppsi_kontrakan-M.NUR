"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useConfirmDelete } from "@/lib/useConfirmDelete";
import { Expense, Property, PaginatedResponse } from "@rental/types";
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

function formatIDR(value: number | string) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const today = () => new Date().toISOString().split("T")[0];

const CATEGORY_SUGGESTIONS = ["Listrik", "Air", "Perbaikan", "Kebersihan", "Keamanan", "Pajak", "Lainnya"];

const EMPTY_FORM = { propertyId: "", category: "", amount: "", expenseDate: today() };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expData, propData] = await Promise.all([
        apiFetch<PaginatedResponse<Expense>>("/expenses", { params: { limit: 100 } }),
        apiFetch<PaginatedResponse<Property>>("/properties", { params: { limit: 100 } }),
      ]);
      setExpenses(expData.data);
      setProperties(propData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const del = useConfirmDelete<Expense>("/expenses", fetchData);

  const openCreate = () => {
    setEditing(null);
    setFormData({ ...EMPTY_FORM, expenseDate: today() });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setFormData({
      propertyId: String(e.propertyId),
      category: e.category,
      amount: String(Math.round(Number(e.amount))),
      expenseDate: e.expenseDate.split("T")[0],
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const common = {
        category: formData.category.trim(),
        amount: Number(formData.amount),
        expenseDate: formData.expenseDate,
      };
      if (editing) {
        // Unit tidak bisa diubah setelah dicatat (aturan backend)
        await apiFetch(`/expenses/${editing.id}`, { method: "PUT", body: JSON.stringify(common) });
      } else {
        await apiFetch("/expenses", {
          method: "POST",
          body: JSON.stringify({ ...common, propertyId: Number(formData.propertyId) }),
        });
      }
      setShowModal(false);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan pengeluaran");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return expenses.filter((e) => {
      const cat = e.category.toLowerCase();
      const code = e.property?.code?.toLowerCase() || "";
      return !term || cat.includes(term) || code.includes(term);
    });
  }, [expenses, search]);

  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biaya & Pengeluaran"
        subtitle="Catat biaya operasional dan perbaikan untuk setiap unit properti."
        actions={<Button onClick={openCreate}>+ Catat Pengeluaran</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Total pengeluaran" value={formatIDR(totalExpense)} secondary="Akumulasi kas keluar" />
        <StatCard label="Jumlah transaksi" value={expenses.length} secondary="Pengeluaran yang tercatat" />
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Cari kategori biaya atau kode unit...",
        }}
      />

      <Table<Expense>
        data={filtered}
        keyExtractor={(e) => e.id}
        loading={loading}
        emptyMessage={
          expenses.length === 0
            ? "Belum ada pengeluaran. Klik \"Catat Pengeluaran\" untuk menambah."
            : "Tidak ada pengeluaran yang cocok."
        }
        columns={[
          {
            header: "Kategori Biaya",
            accessor: (e) => <span className="font-medium text-ink text-sm">{e.category}</span>,
          },
          {
            header: "Unit Terkait",
            accessor: (e) => <span className="text-sm text-ink">{e.property?.code || `#${e.propertyId}`}</span>,
          },
          {
            header: "Tanggal",
            accessor: (e) => <span className="text-sm text-ink-muted">{formatDate(e.expenseDate)}</span>,
          },
          {
            header: "Nominal",
            align: "right",
            accessor: (e) => <span className="font-medium text-error text-sm">{formatIDR(e.amount)}</span>,
          },
          {
            header: "Aksi",
            align: "right",
            accessor: (e) => (
              <div className="flex items-center justify-end gap-4">
                <Button variant="link-blue" className="text-sm font-medium" onClick={() => openEdit(e)}>
                  Edit
                </Button>
                <Button variant="link-red" className="text-sm font-medium" onClick={() => del.request(e)}>
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
        title={editing ? "Edit Pengeluaran" : "Catat Pengeluaran Baru"}
        description="Catat biaya operasional, perbaikan, atau tagihan pada satu unit."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Unit Properti"
            required
            helperText={editing ? "Unit tidak bisa diubah setelah dicatat." : "Setiap pengeluaran dicatat pada satu unit."}
          >
            <select
              className={fieldClass}
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
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

          <FormField label="Kategori biaya" required>
            <input
              type="text"
              list="expense-categories"
              className={fieldClass}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Contoh: Listrik, Perbaikan atap"
              maxLength={100}
              required
            />
            <datalist id="expense-categories">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nominal (Rp)" required>
              <input
                type="number"
                min={1}
                className={fieldClass}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="500000"
                required
              />
            </FormField>

            <FormField label="Tanggal transaksi" required>
              <input
                type="date"
                className={fieldClass}
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                required
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
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Pengeluaran"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!del.target}
        title="Hapus pengeluaran?"
        message={
          del.target
            ? `Pengeluaran "${del.target.category}" sebesar ${formatIDR(del.target.amount)} akan dihapus permanen.`
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
