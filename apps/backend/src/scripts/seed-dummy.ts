/**
 * Seed data DUMMY penyewa (beserta kontrak, pembayaran, parkir) untuk
 * gambaran tampilan panel admin.
 *
 * Pemakaian (dari folder apps/backend):
 *   npm run seed:dummy          -> isi data dummy
 *   npm run seed:dummy:clean    -> hapus SEMUA data dummy
 *
 * Penanda data dummy (dipakai juga oleh perintah clean):
 *   - Tenant.email          berakhiran  @dummy.test
 *   - Tenant.identityNumber berawalan   DUMMY-
 *   - Property.address      "[DUMMY] Alamat belum diisi" (hanya jika tabel
 *     properties kosong dan unit dibuat oleh script ini)
 *
 * Catatan: status terisi/kosong unit asli belum diberikan pemilik
 * (lihat docs/database/property-master-data.md). Script ini hanya menyentuh
 * unit berstatus AVAILABLE, dan `clean` mengembalikannya ke AVAILABLE.
 */
import "../config/env"; // load .env + validasi (fail-fast)
import { ContractStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

const DUMMY_EMAIL_DOMAIN = "dummy.test";
const DUMMY_ADDRESS = "[DUMMY] Alamat belum diisi";

/** Referensi: docs/database/property-master-data.md (9 unit, harga confirmed). */
const MASTER_PROPERTIES = [
  { code: "A1", rent: 2_400_000 },
  { code: "A2", rent: 2_400_000 },
  { code: "B1", rent: 1_800_000 },
  { code: "B2", rent: 1_800_000 },
  { code: "B3", rent: 1_800_000 },
  { code: "C1", rent: 1_800_000 },
  { code: "C2", rent: 1_800_000 },
  { code: "C3", rent: 1_800_000 },
  { code: "C4", rent: 1_800_000 },
];

interface ContractPlan {
  /** Mulai kontrak = hari ini dikurangi N bulan */
  monthsAgo: number;
  durationMonths: number;
  status: ContractStatus;
}

interface TenantPlan {
  fullName: string;
  slug: string;
  phone: string;
  /** 16 digit setelah awalan DUMMY- (bukan NIK sungguhan) */
  ktpDigits: string;
  propertyCode?: string;
  /** Kontrak sebelumnya (status RENEWED) yang diperpanjang oleh `contract` */
  previous?: ContractPlan;
  contract?: ContractPlan;
  parking?: { vehicleType: string; plateNumber: string };
  /** Bulan berjalan belum ada pembayaran -> muncul sebagai "belum bayar" */
  skipCurrentMonthPayment?: boolean;
  /** Pembayaran bulan berjalan baru separuh */
  partialCurrentMonth?: boolean;
  /** Indeks bulan (0 = bulan pertama) yang dibayar terlambat */
  lateMonthIndex?: number;
}

const PLANS: TenantPlan[] = [
  {
    fullName: "Budi Santoso",
    slug: "budi.santoso",
    phone: "081234560001",
    ktpDigits: "3171010101900001",
    propertyCode: "A1",
    previous: { monthsAgo: 14, durationMonths: 12, status: "RENEWED" },
    contract: { monthsAgo: 2, durationMonths: 12, status: "ACTIVE" },
  },
  {
    fullName: "Siti Rahmawati",
    slug: "siti.rahmawati",
    phone: "081234560002",
    ktpDigits: "3171010202920002",
    propertyCode: "A2",
    contract: { monthsAgo: 5, durationMonths: 12, status: "ACTIVE" },
  },
  {
    fullName: "Agus Prasetyo",
    slug: "agus.prasetyo",
    phone: "081234560003",
    ktpDigits: "3171010303880003",
    propertyCode: "B1",
    contract: { monthsAgo: 6, durationMonths: 12, status: "ACTIVE" },
    lateMonthIndex: 2,
  },
  {
    fullName: "Dewi Lestari",
    slug: "dewi.lestari",
    phone: "081234560004",
    ktpDigits: "3171010404950004",
    propertyCode: "B2",
    contract: { monthsAgo: 3, durationMonths: 6, status: "ACTIVE" },
    partialCurrentMonth: true,
  },
  {
    fullName: "Rizky Maulana",
    slug: "rizky.maulana",
    phone: "081234560005",
    ktpDigits: "3171010505970005",
    propertyCode: "C1",
    contract: { monthsAgo: 4, durationMonths: 12, status: "ACTIVE" },
    parking: { vehicleType: "Mobil", plateNumber: "B 1234 DMY" },
  },
  {
    fullName: "Nur Aini",
    slug: "nur.aini",
    phone: "081234560006",
    ktpDigits: "3171010606930006",
    propertyCode: "C2",
    contract: { monthsAgo: 2, durationMonths: 12, status: "ACTIVE" },
    parking: { vehicleType: "Mobil", plateNumber: "B 5678 DMY" },
    skipCurrentMonthPayment: true,
  },
  {
    fullName: "Hendra Gunawan",
    slug: "hendra.gunawan",
    phone: "081234560007",
    ktpDigits: "3171010707850007",
    propertyCode: "B3",
    contract: { monthsAgo: 10, durationMonths: 6, status: "TERMINATED" },
  },
  {
    fullName: "Putri Anggraini",
    slug: "putri.anggraini",
    phone: "081234560008",
    ktpDigits: "3171010808990008",
    // Belum punya kontrak (calon / penyewa tanpa unit)
  },
];

const METHODS: PaymentMethod[] = ["BANK_TRANSFER", "CASH", "E_WALLET"];

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

function emailOf(slug: string): string {
  return `${slug}@${DUMMY_EMAIL_DOMAIN}`;
}

async function ensureProperties() {
  const count = await prisma.property.count();
  if (count > 0) return;

  console.log("Tabel properties kosong -> membuat 9 unit dari master data (ditandai [DUMMY]).");
  for (const p of MASTER_PROPERTIES) {
    await prisma.property.create({
      data: {
        code: p.code,
        name: `Kontrakan ${p.code}`,
        address: DUMMY_ADDRESS,
        rentAmount: p.rent,
        status: "AVAILABLE",
      },
    });
  }
}

async function createContractWithPayments(
  tenantId: number,
  propertyId: number,
  rent: number,
  plan: ContractPlan,
  previousContractId: number | undefined,
  tenantPlan: TenantPlan,
) {
  const today = startOfToday();
  const start = addMonths(today, -plan.monthsAgo);
  const end = addMonths(start, plan.durationMonths);

  const contract = await prisma.contract.create({
    data: {
      propertyId,
      tenantId,
      startDate: start,
      endDate: end,
      rentAmount: rent,
      status: plan.status,
      previousContractId,
    },
  });

  // Bangun daftar jatuh tempo: tiap bulan sejak mulai, hanya yang sudah lewat
  const dueDates: Date[] = [];
  for (let i = 0; ; i++) {
    const due = addMonths(start, i);
    if (due >= end || due > today) break;
    dueDates.push(due);
  }

  const isOngoing = plan.status === "ACTIVE";
  const lastIndex = dueDates.length - 1;

  for (let i = 0; i < dueDates.length; i++) {
    const isCurrentMonth = isOngoing && i === lastIndex;

    if (isCurrentMonth && tenantPlan.skipCurrentMonthPayment) continue;

    let status: PaymentStatus = "PAID";
    let amount = rent;
    if (isCurrentMonth && tenantPlan.partialCurrentMonth) {
      status = "PARTIAL";
      amount = rent / 2;
    } else if (tenantPlan.lateMonthIndex === i) {
      status = "LATE";
    }

    // Pembayaran terlambat dicatat beberapa hari setelah jatuh tempo
    const paymentDate =
      status === "LATE" ? new Date(dueDates[i].getTime() + 9 * 24 * 60 * 60 * 1000) : dueDates[i];

    await prisma.payment.create({
      data: {
        contractId: contract.id,
        amount,
        paymentDate,
        method: METHODS[i % METHODS.length],
        status,
      },
    });
  }

  return contract;
}

async function seed() {
  await ensureProperties();

  let created = 0;
  let skipped = 0;

  for (const plan of PLANS) {
    const email = emailOf(plan.slug);
    const existing = await prisma.tenant.findUnique({ where: { email } });
    if (existing) {
      console.log(`- Lewati ${plan.fullName}: sudah ada.`);
      skipped++;
      continue;
    }

    const tenant = await prisma.tenant.create({
      data: {
        fullName: plan.fullName,
        phone: plan.phone,
        email,
        identityNumber: `DUMMY-${plan.ktpDigits}`,
      },
    });
    created++;
    console.log(`+ Penyewa: ${tenant.fullName}`);

    if (!plan.propertyCode || !plan.contract) continue;

    const property = await prisma.property.findUnique({
      where: { code: plan.propertyCode },
    });
    if (!property) {
      console.log(`  ! Unit ${plan.propertyCode} tidak ditemukan, kontrak dilewati.`);
      continue;
    }
    if (property.status !== "AVAILABLE") {
      console.log(
        `  ! Unit ${plan.propertyCode} berstatus ${property.status} (bukan AVAILABLE), kontrak dilewati.`,
      );
      continue;
    }

    const fallbackRent = MASTER_PROPERTIES.find((p) => p.code === property.code)?.rent ?? 0;
    const rent = Number(property.rentAmount) > 0 ? Number(property.rentAmount) : fallbackRent;

    let previousId: number | undefined;
    if (plan.previous) {
      const prev = await createContractWithPayments(
        tenant.id,
        property.id,
        rent,
        plan.previous,
        undefined,
        { ...plan, lateMonthIndex: undefined },
      );
      previousId = prev.id;
    }

    await createContractWithPayments(
      tenant.id,
      property.id,
      rent,
      plan.contract,
      previousId,
      plan,
    );

    await prisma.property.update({
      where: { id: property.id },
      data: { status: plan.contract.status === "ACTIVE" ? "OCCUPIED" : "AVAILABLE" },
    });
    console.log(`  Kontrak ${plan.contract.status} untuk unit ${property.code}`);

    if (plan.parking) {
      await prisma.parking.create({
        data: {
          propertyId: property.id,
          tenantId: tenant.id,
          vehicleType: plan.parking.vehicleType,
          plateNumber: plan.parking.plateNumber,
        },
      });
    }
  }

  console.log(`\nSelesai: ${created} penyewa dibuat, ${skipped} dilewati.`);
  console.log("Hapus semua data dummy kapan saja dengan: npm run seed:dummy:clean");
}

async function clean() {
  const tenants = await prisma.tenant.findMany({
    where: { email: { endsWith: `@${DUMMY_EMAIL_DOMAIN}` } },
    select: { id: true },
  });
  const tenantIds = tenants.map((t) => t.id);

  if (tenantIds.length > 0) {
    const contracts = await prisma.contract.findMany({
      where: { tenantId: { in: tenantIds } },
      select: { id: true, propertyId: true, previousContractId: true },
    });
    const contractIds = contracts.map((c) => c.id);
    const propertyIds = Array.from(new Set(contracts.map((c) => c.propertyId)));

    await prisma.payment.deleteMany({ where: { contractId: { in: contractIds } } });
    // Kontrak perpanjangan (punya previousContractId) dihapus lebih dulu
    await prisma.contract.deleteMany({
      where: { id: { in: contractIds }, previousContractId: { not: null } },
    });
    await prisma.contract.deleteMany({ where: { id: { in: contractIds } } });
    await prisma.parking.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });

    // Kembalikan unit ke AVAILABLE bila tidak ada kontrak aktif lain
    for (const propertyId of propertyIds) {
      const stillActive = await prisma.contract.count({
        where: { propertyId, status: "ACTIVE" },
      });
      if (stillActive === 0) {
        await prisma.property.update({
          where: { id: propertyId },
          data: { status: "AVAILABLE" },
        });
      }
    }
    console.log(`Dihapus: ${tenantIds.length} penyewa dummy beserta kontrak/pembayaran/parkir.`);
  } else {
    console.log("Tidak ada penyewa dummy.");
  }

  // Hapus unit yang dibuat script ini (hanya yang bertanda [DUMMY] dan tanpa relasi)
  const dummyProps = await prisma.property.findMany({ where: { address: DUMMY_ADDRESS } });
  let removedProps = 0;
  for (const p of dummyProps) {
    try {
      await prisma.property.delete({ where: { id: p.id } });
      removedProps++;
    } catch {
      console.log(`Unit ${p.code} masih punya data terkait, tidak dihapus.`);
    }
  }
  if (removedProps > 0) console.log(`Dihapus: ${removedProps} unit bertanda [DUMMY].`);
}

async function main() {
  if (process.argv.includes("--clean")) {
    await clean();
  } else {
    await seed();
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
