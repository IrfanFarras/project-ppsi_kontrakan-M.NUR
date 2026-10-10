# Property Master Data — Confirmed

> Data ini **fakta/confirmed** dari pemilik (bukan asumsi). Status occupied/vacant **sengaja tidak dicantumkan** karena belum diberikan — jangan diasumsikan oleh siapa pun (termasuk Claude) di tahap manapun.

Total: **9 unit rumah kontrakan**. Disewakan sebagai satu unit rumah utuh (bukan per kamar).

| Kode | Lantai | Kamar Tidur | Kamar Mandi | Ukuran Bangunan | Ukuran Tanah | Harga Sewa/bulan | Tambahan |
|---|---|---|---|---|---|---|---|
| A1 | 2 | 2 (di lantai 2) | 1 | 3×8 m | 3×10 m | Rp2.400.000 | — |
| A2 | 1 | 2 | 1 | 5×7 m | — [TBD] | Rp2.400.000 | — |
| B1 | 1 | 1 | 1 | 3×5 m | — [TBD] | Rp1.800.000 | — |
| B2 | 1 | 1 | 1 | 3×5 m (sama seperti B1) | — [TBD] | Rp1.800.000 | — |
| B3 | 1 | 1 | 1 | 3×5 m (sama seperti B1) | — [TBD] | Rp1.800.000 | — |
| C1 | 1 | 1 | 1 | 3×6 m | — [TBD] | Rp1.800.000 | Parkir mobil +Rp300.000/bulan |
| C2 | 1 | 1 | 1 | 3×6 m (sama seperti C1) | — [TBD] | Rp1.800.000 | Parkir mobil +Rp300.000/bulan |
| C3 | 1 | 1 | 1 | 3×6 m (sama seperti C1) | — [TBD] | Rp1.800.000 | Parkir mobil +Rp300.000/bulan |
| C4 | 1 | 1 | 1 | 3×6 m (sama seperti C1) | — [TBD] | Rp1.800.000 | Parkir mobil +Rp300.000/bulan |

## Catatan Penting
- **Ukuran tanah** hanya diketahui untuk A1 (3×10 m). Untuk A2, B1–B3, C1–C4 belum diberikan → `[TBD]`.
- **Status occupied/vacant saat ini TIDAK BOLEH diasumsikan** — belum ada datanya.
- Biaya parkir tambahan (C1–C4, Rp300.000/bulan) adalah **item terpisah** dari sewa rumah — relevan dengan model `Parking`, bukan digabung ke `rentAmount` Contract. Ini memperkuat kebutuhan menyelesaikan `[DECISION REQUIRED]` relasi `Parking` di `docs/database/erd.md`.
- Data ini digunakan sebagai referensi untuk seed data **nanti** (belum dibuat di tahap ini) — bukan untuk diinput manual ke kode sekarang.

## Status Data per Property (Confirmed vs TBD)

| Field | Status |
|---|---|
| Kode/nama unit (A1, A2, B1–B3, C1–C4) | Confirmed |
| Jumlah lantai, kamar, kamar mandi | Confirmed |
| Ukuran bangunan | Confirmed |
| Ukuran tanah | Confirmed hanya A1; sisanya `[TBD]` |
| Harga sewa/bulan | Confirmed |
| Biaya parkir tambahan (C1–C4) | Confirmed |
| Status occupied/vacant | `[TBD]` — belum diberikan |
| Alamat lengkap per unit | `[TBD]` — belum diberikan (field `Property.address` di schema masih kosong secara data) |
