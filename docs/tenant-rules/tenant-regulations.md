# Tenant Regulations — Draft Struktur

> **Tenant Rules** = peraturan yang mengatur *perilaku/kewajiban penyewa* selama masa sewa.
> Ini BUKAN aturan sistem/software. Untuk itu lihat `docs/business-rules/system-rules.md`.
> Dokumen ini nantinya dapat ditampilkan di Tenant Portal (masa depan).
>
> Status: **DRAFT STRUKTUR**. Sebagian besar isi belum diputuskan pemilik — ditandai `[DECISION REQUIRED]`. Tidak ada nominal/kebijakan yang dikarang.

## 1. Pembayaran Sewa
- Pembayaran sewa harus dilakukan sesuai tanggal yang disepakati — tanggal jatuh tempo pasti: **[DECISION REQUIRED]**.
- Metode pembayaran yang diterima: **[DECISION REQUIRED]**.
- Denda keterlambatan: **[DECISION REQUIRED]**.

## 2. Penggunaan Rumah
- Perubahan bangunan membutuhkan izin pemilik (prinsip sudah disebut user).
- Penyewa tidak boleh menyewakan kembali (sublease) rumah tanpa izin (prinsip sudah disebut user).
- Batasan penggunaan (hunian vs komersial): **[DECISION REQUIRED]**.

## 3. Kebersihan
- Penyewa bertanggung jawab atas kebersihan rumah (prinsip sudah disebut user).
- Standar kebersihan minimum & detail teknis: **[DECISION REQUIRED]**.

## 4. Kerusakan & Maintenance
- Kerusakan akibat kelalaian penyewa dapat dibebankan kepada penyewa (prinsip sudah disebut user).
- Prosedur pelaporan, SLA perbaikan: **[DECISION REQUIRED]**.

## 5. Penghuni & Tamu
- Aturan tamu (durasi menginap, izin): **[DECISION REQUIRED]**.
- Jumlah maksimum penghuni per unit: **[DECISION REQUIRED]**.

## 6. Kendaraan & Parkir
- Aturan parkir berlaku, termasuk unit dengan tambahan lahan parkir mobil (C1–C4, +Rp300.000/bulan — lihat `docs/database/property-master-data.md`).
- Jumlah kendaraan maksimum, aturan parkir tamu: **[DECISION REQUIRED]**.

## 7. Hewan Peliharaan
- Aturan hewan peliharaan berlaku (prinsip disebut user) — detail diizinkan/tidak, jenis, jumlah: **[DECISION REQUIRED]**.

## 8. Larangan
- Aktivitas ilegal — umumnya standar, cakupan detail: **[DECISION REQUIRED]**.
- Larangan lain (kebisingan, dsb.): **[DECISION REQUIRED]**.

## 9. Akses Pemilik/Pengelola
- Hak akses pemilik untuk masuk ke unit (pemberitahuan, durasi): **[DECISION REQUIRED]**.

## 10. Perpanjangan Kontrak
- Prosedur & jangka waktu pengajuan perpanjangan: **[DECISION REQUIRED]**.
- Catatan sistem: perpanjangan selalu membuat Contract baru (lihat SR-C3 di `system-rules.md`), tidak menimpa histori.

## 11. Pengakhiran Kontrak (Aturan Ketertiban/Pengakhiran Sewa)
- Ketentuan notice period, konsekuensi pengakhiran sepihak: **[DECISION REQUIRED]**.

## 12. Serah Terima
- Checklist serah terima awal & akhir, deposit: **[DECISION REQUIRED]** (ingat prinsip: Deposit ≠ Rental Revenue, lihat `system-rules.md` SR-PAY3).

## 13. Pelanggaran
- Kategori pelanggaran & sanksi: **[DECISION REQUIRED]**.

---

## Catatan
Dokumen ini adalah kerangka kategori. Prinsip-prinsip yang eksplisit disebutkan pemilik (kebersihan, sublease, kerusakan akibat kelalaian, izin renovasi, hewan peliharaan) sudah dicatat sebagai **arah kebijakan**, tapi **detail operasional (nominal, durasi, prosedur)** tetap `[DECISION REQUIRED]` sampai dikonfirmasi eksplisit.
