# System Rules — Rental Management System

> **System Rules** = aturan yang mengontrol perilaku *software/aplikasi* (data integrity, workflow, status, authorization).
> Ini BUKAN peraturan perilaku penyewa. Untuk itu lihat `docs/tenant-rules/tenant-regulations.md`.
>
> Keputusan finalisasi lihat: `docs/decisions/2026-09-22-stage2-business-rules.md`

---

## 1. Property Rules
- SR-P1: Satu Property hanya boleh memiliki **satu Contract berstatus `ACTIVE`** pada satu waktu.
- SR-P2: `Property.currentTenant` **tidak boleh** dibuat sebagai field statis — penyewa saat ini selalu diturunkan dari Contract `ACTIVE`.
- SR-P3: Property status (`AVAILABLE/OCCUPIED/UNDER_MAINTENANCE`) adalah konsep **terpisah** dari status Maintenance (`REPORTED/IN_PROGRESS/COMPLETED`) — tidak boleh digabung/disamakan.
- SR-P4: Property boleh **hard-delete** hanya jika belum punya histori Contract/Maintenance/Expense sama sekali. Kalau sudah ada histori, penghapusan diblokir (data harus dinonaktifkan, bukan dihapus).

## 2. Tenant Rules (level sistem, bukan perilaku)
- SR-T1: Data Tenant independen dari Property — satu Tenant bisa punya banyak Contract sepanjang waktu (histori tetap tersimpan).
- SR-T2: Tenant hanya boleh melihat data miliknya sendiri (relevan untuk Tenant Portal, masa depan) — ini aturan **authorization**, bukan tenant regulation.

## 3. Contract Rules
- SR-C1: Contract baru hanya bisa dibuat jika Property tidak sedang memiliki Contract `ACTIVE`.
- SR-C2: **Contract yang sudah selesai (`EXPIRED`/`TERMINATED`) tidak boleh dihapus** — merupakan histori bisnis, wajib dipertahankan permanen (soft-delete saja jika perlu diarsipkan).
- SR-C3: Renewal Contract **wajib** membuat record baru (`previousContractId` menunjuk ke Contract lama) — dilarang meng-update/menimpa Contract lama.
- SR-C4: Status Contract: `ACTIVE`, `EXPIRED`, `TERMINATED`, `RENEWED`. Transisi `ACTIVE → EXPIRED` berjalan **otomatis** via scheduled job harian (berdasarkan `endDate`), dan admin bisa **override manual** kapan saja (mis. set `TERMINATED` lebih awal).
- SR-C5: Contract memiliki `depositAmount` (dicatat sekali saat Contract dibuat). Deposit **bukan** rental revenue — tidak pernah masuk sebagai `Payment` atau dihitung dalam laporan pendapatan sewa (lihat SR-PAY3).

## 4. Payment Rules
- SR-PAY1: Setiap Payment wajib terhubung ke satu Contract.
- SR-PAY2: Status Payment final: `PAID`, `PARTIAL`, `LATE`, `UNPAID`.
- SR-PAY3: **Deposit ≠ Rental Revenue** — deposit dicatat di `Contract.depositAmount` (lihat SR-C5), bukan sebagai Payment, dan tidak boleh dihitung sebagai pendapatan sewa dalam laporan apa pun.
- SR-PAY4: **Tidak ada denda otomatis** untuk keterlambatan — keterlambatan cukup dicatat lewat status `LATE`, tanpa perhitungan denda/grace period di sistem.

## 5. Maintenance Rules
- SR-M1: Maintenance memiliki lifecycle status: `REPORTED → IN_PROGRESS → COMPLETED`.
- SR-M2: Maintenance selalu terhubung ke Property (bukan ke Tenant/Contract langsung).
- SR-M3: Maintenance dan Expense adalah entitas terpisah (`Maintenance ≠ Expense`); Expense boleh mereferensikan Maintenance secara opsional.

## 6. Expense Rules
- SR-E1: Expense selalu terhubung ke Property (opsional juga bisa mereferensikan Maintenance).
- SR-E2: Kategori Expense final: `MAINTENANCE`, `UTILITIES`, `TAX`, `INSURANCE`, `CLEANING`, `RENOVATION`, `OTHER`.

## 7. Parking Rules
- SR-PK1: Parking adalah entitas terpisah, tidak digabung ke Tenant/Contract/Property sebagai field.
- SR-PK2: Parking **wajib** memiliki relasi ke **Property DAN Tenant sekaligus** (keduanya mandatory, bukan opsional/salah satu).
- SR-PK3: Biaya tambahan parkir (mis. Rp300.000/bulan untuk C1–C4) adalah item terpisah dari `rentAmount` Contract.

## 8. Authentication & Authorization Rules
- SR-AUTH1: Autentikasi menggunakan JWT; password di-hash dengan bcrypt (tidak pernah disimpan plaintext).
- SR-AUTH2: Autorisasi **wajib** ditegakkan di backend (Express), tidak boleh hanya mengandalkan penyembunyian UI di frontend.
- SR-AUTH3: Admin/Owner dapat mengelola seluruh Property.
- SR-AUTH4: Tenant (via Tenant Portal, masa depan) hanya boleh mengakses data miliknya sendiri.
- SR-AUTH5: **Ditunda** — hanya 1 role (`ADMIN`) untuk saat ini, tidak ada role tambahan (STAFF, dll) selama sistem masih dipakai 1 pengguna. Revisit jika ada kebutuhan multi-user.

## 9. General Data Integrity Rules
- SR-G1: Semua foreign key wajib valid (tidak ada orphan record).
- SR-G2: Data historis (Contract, Payment, Maintenance, Expense) tidak boleh hilang akibat perubahan kondisi saat ini.
- SR-G3: Seluruh entitas transaksional (Contract, Payment, Maintenance, Expense) memiliki timestamp `createdAt`/`updatedAt`.
- SR-G4: Entitas transaksional (Contract, Payment, Maintenance, Expense) menggunakan **soft-delete** (`deletedAt`), tidak pernah dihapus permanen dari DB.
