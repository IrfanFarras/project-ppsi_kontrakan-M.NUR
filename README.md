# Rental Management System

Sistem sederhana untuk mengelola 9 rumah kontrakan keluarga, meliputi data properti, penyewa, dan pembayaran sewa.

## Struktur Folder
- `frontend/` — Aplikasi Next.js (UI)
- `backend/` — API Express (business logic)
- `database/` — Skema & migrasi Prisma/MySQL
- `docs/` — Dokumentasi project

## Tech Stack
Next.js 16 · TypeScript · Tailwind CSS · Node.js · Express · Prisma · MySQL

## Status
✅ **Phase 3 & 4 Complete** — Backend API fully functional dengan domain model lengkap, CRUD endpoints, dan laporan bulanan.

## Setup Backend (Development)

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL (default: mysql://root@localhost:3306/rental_management)
npm install
npm run prisma:generate
npm run prisma:migrate:dev  # buat database & run migration
npm run dev                 # jalankan server dev (tsx watch)
```

Server berjalan di: `http://localhost:4000`

**API Endpoints:**
- Properties: `/api/properties`
- Tenants: `/api/tenants`
- Contracts: `/api/contracts`
- Payments: `/api/payments`
- Reports: `/api/reports/monthly?year=2026&month=9`

Dokumentasi lengkap: `docs/API.md`

## Setup Frontend
Belum tersedia — akan ditambahkan pada phase berikutnya.
