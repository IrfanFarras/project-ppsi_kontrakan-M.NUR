# System Architecture — Rental Management System

## 1. Tujuan
Mendokumentasikan arsitektur, modul, role, alur utama, domain boundaries, dan batas tanggung jawab tiap layer.

---

## 2. Arsitektur Teknis (Confirmed)

```
Browser
  ↓
Next.js 16 (App Router, React, TypeScript, Tailwind v4, shadcn/ui, React Hook Form, TanStack Query, Recharts)
  ↓  REST API (JSON, HTTP/S)
Express.js Backend (Node.js, TypeScript, JWT, bcrypt)
  ↓
Prisma ORM
  ↓
MySQL 8
```

- Frontend **tidak pernah** mengakses database secara langsung.
- Business logic penting (perhitungan, validasi otoritatif, authorization) **wajib** di backend, bukan di frontend.
- Authorization **wajib** dilakukan di backend, tidak boleh hanya mengandalkan UI hiding.

---

## 3. Modul / Domain Utama

| Domain | Deskripsi | Status |
|---|---|---|
| **Authentication** | Login, token (JWT), password hashing (bcrypt) | Confirmed sebagai domain, implementasi [TBD] |
| **User** | Akun pengguna sistem & role | Confirmed |
| **Property** | 9 unit rumah kontrakan | Confirmed (data lihat `docs/database/property-master-data.md`) |
| **Tenant** | Data penyewa | Confirmed |
| **Contract** | Kontrak sewa (Property ↔ Tenant) | Confirmed |
| **Payment** | Pembayaran sewa terhadap Contract | Confirmed |
| **Maintenance** | Perbaikan/kerusakan properti | Confirmed |
| **Expense** | Pengeluaran terkait properti | Confirmed |
| **Parking** | Slot/kendaraan parkir | Confirmed sebagai entitas terpisah, relasi FK [DECISION REQUIRED] |
| **Notification** | Pengingat jatuh tempo, dsb. | Confirmed sebagai domain masa depan, mekanisme [TBD] |
| **Reports** | Laporan pendapatan/pengeluaran, dashboard | Confirmed sebagai domain masa depan, bentuk laporan [TBD] |
| **Tenant Portal** | Akses tenant melihat data miliknya sendiri | Confirmed sebagai target jangka panjang, scope [TBD] |

Catatan: pada tahap foundation ini, domain-domain di atas hanya didefinisikan sebagai **boundary**, belum ada implementasi fitur/CRUD.

---

## 4. Role Pengguna (High-Level)

| Role | Deskripsi | Status |
|---|---|---|
| Admin/Owner (keluarga) | Mengelola seluruh property, contract, payment, maintenance, expense | Confirmed (prinsip: "admin dapat mengelola seluruh property") |
| Tenant | Hanya boleh melihat data miliknya sendiri (via Tenant Portal, masa depan) | Confirmed prinsip, implementasi portal [TBD] |
| Staff tambahan (non-keluarga) | — | [DECISION REQUIRED] apakah ada role ini |

Permission matrix detail per role/aksi: **[DECISION REQUIRED]**.

---

## 5. Domain Dependency Map

```
Property
   ↓
Contract  ←→  Tenant   (Contract menghubungkan Property & Tenant; BUKAN Property.currentTenant)
   ↓
Payment

Property
   ↓
Maintenance
   ↓
Expense   (Expense juga bisa langsung terhadap Property, tidak wajib lewat Maintenance)

Property
   ↓
Parking Slot   (entitas independen)
```

**Prinsip penting**: `Property.currentTenant` **TIDAK** dibuat sebagai field/source of truth. Tenant yang sedang menempati sebuah Property harus selalu **diturunkan (derived)** dari Contract yang berstatus `ACTIVE` milik Property tersebut — bukan disimpan sebagai kolom statis. Ini sudah konsisten dengan `backend/prisma/schema.prisma` (Property tidak punya kolom `currentTenantId`).

---

## 6. Batas Tanggung Jawab

### Frontend (Next.js)
- UI, validasi input awal (client-side), pemanggilan REST API.
- Tidak menyimpan business logic otoritatif.

### Backend (Express)
- Seluruh business logic & validasi otoritatif.
- Autentikasi (JWT) & otorisasi (role-based) — **wajib di backend**.
- Satu-satunya layer yang bicara ke Prisma/MySQL.

### Database (MySQL via Prisma)
- Menyimpan data, menegakkan constraint tingkat data (PK/FK/unique).
- Tidak menyimpan business logic prosedural kompleks.

---

## 7. Prinsip Bisnis Penting (Confirmed — wajib dipatuhi seluruh development berikutnya)

- Property ≠ Tenant
- Tenant ≠ Contract
- Contract ≠ Payment
- Maintenance ≠ Expense
- **Deposit ≠ Rental Revenue** (deposit bukan bagian dari pendapatan sewa; keduanya harus tercatat/terhitung terpisah — model data untuk deposit: **[DECISION REQUIRED]**, belum ada di schema saat ini)
- **Property status ≠ Maintenance status** (status hunian property — `AVAILABLE/OCCUPIED/UNDER_MAINTENANCE` — adalah hal berbeda dari status tiket maintenance — `REPORTED/IN_PROGRESS/COMPLETED`; keduanya sudah dipisah sebagai 2 enum berbeda di schema)
- Data historis tidak boleh hilang karena kondisi saat ini berubah (mis. histori Tenant A tetap tersimpan meski Property sudah disewa Tenant B berikutnya) — dijamin lewat model `Contract` yang menyimpan history, bukan overwrite.
- Satu Property hanya boleh memiliki satu Contract `ACTIVE`.
- Contract yang sudah selesai **tidak boleh dihapus** — merupakan histori.
- Renewal contract **wajib** membuat record Contract baru (lihat `previousContractId` di schema), tidak menimpa yang lama.

---

## 8. Referensi
- Data properti: `docs/database/property-master-data.md`
- System rules: `docs/business-rules/system-rules.md`
- Tenant rules: `docs/tenant-rules/tenant-regulations.md`
- ERD: `docs/database/erd.md`
- API conventions: `docs/api/api-conventions.md`
- Decision log: `docs/decisions/architecture-decisions.md`
