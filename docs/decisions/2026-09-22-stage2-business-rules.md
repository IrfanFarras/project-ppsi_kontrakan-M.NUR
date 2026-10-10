# ADR: Stage 2 — Keputusan Business Rules

**Tanggal:** 2026-09-22
**Status:** Disetujui owner

Keputusan berikut menuntaskan seluruh item `[DECISION REQUIRED]` di `docs/business-rules/system-rules.md`.

---

## 1. Soft-delete vs Hard-delete (SR-P4 / SR-G4)
- **Entitas transaksional** (Contract, Payment, Maintenance, Expense): **soft-delete** — tandai `deletedAt`/`isDeleted`, data tidak pernah hilang dari DB.
- **Master data** (Property, Tenant): boleh **hard-delete**, tapi HANYA jika entitas tsb belum punya histori terkait sama sekali (tidak ada Contract/Payment/Maintenance/Expense yang mereferensikannya). Kalau sudah ada histori → hapus diblokir (harus soft-delete/nonaktifkan saja).

**Dampak schema:** perlu tambah kolom `deletedAt DateTime?` di model Contract, Payment, Maintenance, Expense. Query default harus exclude yang `deletedAt IS NOT NULL`.

## 2. Transisi Status Contract (SR-C4)
- `ACTIVE → EXPIRED` berjalan **otomatis** lewat scheduled job (cek harian, bandingkan `endDate` vs tanggal sekarang).
- Admin tetap bisa **override manual** kapan saja (misal set `TERMINATED` sebelum `endDate`, atau perpanjang).

**Dampak backend:** perlu cron/scheduled task baru (mis. `node-cron` atau route yang dipanggil scheduler eksternal) untuk auto-update status Contract yang lewat `endDate`.

## 3. Status Payment Final (SR-PAY2)
Enum final: **`PAID`, `PARTIAL`, `LATE`, `UNPAID`**.

**Dampak schema:** update enum `PaymentStatus` di Prisma (tambah `UNPAID`), migration baru. Update juga `Badge` variant mapping di frontend (`payments/page.tsx`) untuk status baru.

## 4. Denda Keterlambatan (SR-PAY4)
**Tidak ada denda otomatis** — cukup dicatat via status `LATE`. Tidak perlu field `lateFee`/grace period di schema untuk saat ini.

## 5. Model Deposit (SR-PAY3)
Deposit dicatat sebagai **field baru di Contract**: `depositAmount Decimal`. Dicatat sekali saat Contract dibuat, tidak dibuat entitas/tabel terpisah. **Deposit tetap terpisah dari rental revenue** — tidak pernah dihitung sebagai `Payment`/masuk ke laporan pendapatan sewa (sesuai SR-PAY3 existing).

**Dampak schema:** tambah kolom `depositAmount` (nullable atau default 0) di model Contract. Update form Contract di frontend untuk input deposit.

## 6. Kategori Expense (SR-E2)
Enum final: **`MAINTENANCE`, `UTILITIES`, `TAX`, `INSURANCE`, `CLEANING`, `RENOVATION`, `OTHER`**.

**Dampak schema:** tambah/update enum `ExpenseCategory` di Prisma, migration baru. Update form Expense (dropdown kategori) di frontend.

## 7. Relasi Parking (SR-PK2)
Parking **wajib** punya relasi ke **Property DAN Tenant sekaligus** (keduanya mandatory, bukan opsional/salah satu).

**Dampak schema:** ubah `tenantId` di model Parking dari optional (`Int?`) jadi **required** (`Int`) kalau saat ini opsional — cek schema aktual dulu sebelum migration (existing data yang `tenantId` null perlu di-backfill atau dihapus dulu).

## 8. Role & Permission (SR-AUTH5)
**Ditunda.** Tetap 1 role (`ADMIN`) untuk saat ini — belum perlu STAFF/role tambahan selama masih dipakai 1 orang (owner). Revisit kalau ada kebutuhan multi-user di masa depan.

---

## Ringkasan Dampak Teknis (untuk Stage 3)
| # | Perubahan Schema | Perubahan Frontend |
|---|---|---|
| 1 | + `deletedAt` di Contract/Payment/Maintenance/Expense | Filter query default exclude soft-deleted |
| 2 | Scheduled job auto-expire Contract | (opsional) indikator "auto-expired" di UI |
| 3 | Enum `PaymentStatus` + `UNPAID` | Badge variant untuk `UNPAID` |
| 4 | — (tidak ada perubahan) | — |
| 5 | + `depositAmount` di Contract | Input deposit di form Contract |
| 6 | Enum `ExpenseCategory` (7 kategori) | Dropdown kategori di form Expense |
| 7 | `Parking.tenantId` jadi required | Field Tenant jadi wajib di form Parking |
| 8 | — (ditunda) | — |
