# API Endpoints Documentation

Base URL: `http://localhost:4000/api`

---

## Properties

### GET /api/properties
Ambil semua properties dengan pagination & filter.

**Query Parameters:**
- `status` (optional): `AVAILABLE` | `OCCUPIED` | `UNDER_MAINTENANCE`
- `page` (optional): default `1`
- `limit` (optional): default `20`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "code": "RUMAH-01",
      "name": "Rumah Kontrakan 1",
      "address": "Jl. Example No. 1, Jakarta",
      "status": "OCCUPIED",
      "createdAt": "2026-09-12T08:01:06.805Z",
      "updatedAt": "2026-09-12T08:01:14.865Z",
      "contracts": [...]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### GET /api/properties/:id
Ambil detail property by ID.

### POST /api/properties
Buat property baru.

**Body:**
```json
{
  "code": "RUMAH-01",
  "name": "Rumah Kontrakan 1",
  "address": "Jl. Example No. 1, Jakarta",
  "status": "AVAILABLE"  // optional
}
```

### PUT /api/properties/:id
Update property.

### DELETE /api/properties/:id
Hapus property (hanya jika tidak ada active contract).

---

## Tenants

### GET /api/tenants
Ambil semua tenants dengan pagination.

**Query Parameters:**
- `page` (optional): default `1`
- `limit` (optional): default `20`

### GET /api/tenants/:id
Detail tenant + contract history.

### POST /api/tenants
Buat tenant baru.

**Body:**
```json
{
  "fullName": "Ahmad Santoso",
  "phone": "081234567890",
  "email": "ahmad@example.com",  // optional
  "identityNumber": "3201..."     // optional
}
```

### PUT /api/tenants/:id
Update tenant.

### DELETE /api/tenants/:id
Hapus tenant (hanya jika tidak ada active contract).

---

## Contracts

### GET /api/contracts
Ambil semua contracts dengan filter.

**Query Parameters:**
- `propertyId` (optional): filter by property
- `tenantId` (optional): filter by tenant
- `status` (optional): `ACTIVE` | `EXPIRED` | `TERMINATED` | `RENEWED`
- `page` (optional): default `1`
- `limit` (optional): default `20`

### GET /api/contracts/:id
Detail contract + payments.

### POST /api/contracts
Buat contract baru.

**Body:**
```json
{
  "propertyId": 1,
  "tenantId": 1,
  "startDate": "2026-09-01",
  "endDate": "2027-09-01",
  "rentAmount": 2500000,
  "previousContractId": null  // optional, untuk renewal
}
```

**Business Rules:**
- Satu property hanya boleh punya 1 active contract
- Property status otomatis jadi `OCCUPIED` saat contract dibuat
- StartDate harus sebelum endDate

### PUT /api/contracts/:id
Update contract.

### DELETE /api/contracts/:id
Hapus contract (hanya jika belum ada payment).

---

## Payments

### GET /api/payments
Ambil semua payments dengan filter.

**Query Parameters:**
- `contractId` (optional): filter by contract
- `status` (optional): `PAID` | `PARTIAL` | `LATE`
- `page` (optional): default `1`
- `limit` (optional): default `20`

### GET /api/payments/:id
Detail payment.

### POST /api/payments
Catat pembayaran baru.

**Body:**
```json
{
  "contractId": 1,
  "amount": 2500000,
  "paymentDate": "2026-09-10",
  "method": "Transfer Bank",  // optional
  "status": "PAID"             // optional, default PAID
}
```

**Business Rules:**
- Contract harus status `ACTIVE`

### PUT /api/payments/:id
Update payment.

### DELETE /api/payments/:id
Hapus payment.

---

## Reports

### GET /api/reports/monthly
Laporan keuangan bulanan.

**Query Parameters (required):**
- `year`: tahun (2000-2100)
- `month`: bulan (1-12)

**Response:**
```json
{
  "period": {
    "year": 2026,
    "month": 9,
    "monthName": "September"
  },
  "summary": {
    "totalIncome": 2500000,
    "paidPaymentsCount": 1,
    "totalPayments": 1,
    "unpaidContractsCount": 0,
    "activeContractsCount": 1
  },
  "payments": [
    {
      "id": 1,
      "amount": "2500000",
      "paymentDate": "2026-09-10T00:00:00.000Z",
      "status": "PAID",
      "method": "Transfer Bank",
      "contract": {
        "id": 1,
        "property": {
          "code": "RUMAH-01",
          "name": "Rumah Kontrakan 1"
        },
        "tenant": {
          "fullName": "Ahmad Santoso"
        }
      }
    }
  ],
  "unpaidContracts": [
    // Contract aktif yang belum bayar periode ini
  ]
}
```

**Logic:**
- `totalIncome`: total semua payment di bulan tersebut
- `paidPaymentsCount`: jumlah payment dengan status `PAID`
- `unpaidContracts`: contract aktif yang TIDAK punya payment PAID di bulan tersebut

---

## Error Responses

Semua endpoint mengembalikan error dalam format:

```json
{
  "error": "Error message",
  "status": 400
}
```

**Common Status Codes:**
- `400`: Bad Request (validasi gagal)
- `404`: Not Found (resource tidak ditemukan)
- `500`: Internal Server Error
