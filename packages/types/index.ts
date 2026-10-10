// Type definitions based on backend API
export interface Property {
  id: number;
  code: string;
  name: string;
  address: string;
  /** Tarif sewa per bulan; harus > 0 agar order unit ini bisa disetujui */
  rentAmount: string | number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'RESERVED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  contracts?: Contract[];
}

export interface Tenant {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  identityNumber: string;
  createdAt: string;
  updatedAt: string;
  contracts?: Contract[];
}

export interface Contract {
  id: number;
  propertyId: number;
  tenantId: number;
  startDate: string;
  endDate: string;
  rentAmount: string | number;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';
  createdAt: string;
  updatedAt: string;
  previousContractId?: number;
  property?: Property;
  tenant?: Tenant;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  contractId: number;
  amount: string | number;
  paymentDate: string;
  method?: 'CASH' | 'BANK_TRANSFER' | 'E_WALLET' | 'OTHER';
  status: 'PAID' | 'PARTIAL' | 'LATE' | 'UNPAID';
  /** Turunan (tidak disimpan di DB) — lihat backend/src/utils/lateFee.util.ts */
  lateFee?: number;
  createdAt: string;
  updatedAt: string;
  contract?: Contract;
}

export interface Maintenance {
  id: number;
  propertyId: number;
  reportedById?: number;
  description: string;
  status: 'REPORTED' | 'IN_PROGRESS' | 'COMPLETED';
  reportedAt: string;
  completedAt?: string;
  updatedAt: string;
  property?: Property;
  reportedBy?: { id: number; name: string };
  expenses?: Expense[];
}

export interface Expense {
  id: number;
  propertyId: number;
  maintenanceId?: number;
  category: string;
  amount: string | number;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  maintenance?: Maintenance;
}

export interface Parking {
  id: number;
  propertyId?: number;
  tenantId?: number;
  vehicleType?: string;
  plateNumber?: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  tenant?: Tenant;
}

export interface Order {
  id: number;
  userId?: number | null;
  propertyId: number;
  tenantFullName: string;
  tenantPhone: string;
  tenantEmail: string;
  requestedStartDate: string;
  requestedEndDate: string;
  /** Snapshot tarif sewa saat order dibuat */
  rentAmountSnapshot: string | number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  property?: Property;
}

export interface MonthlyReport {
  period: {
    year: number;
    month: number;
    monthName: string;
  };
  summary: {
    totalIncome: number;
    paidPaymentsCount: number;
    totalPayments: number;
    unpaidContractsCount: number;
    activeContractsCount: number;
  };
  payments: Array<{
    id: number;
    amount: string;
    paymentDate: string;
    status: string;
    method?: string;
    contract: {
      id: number;
      property: {
        code: string;
        name: string;
      };
      tenant: {
        fullName: string;
      };
    };
  }>;
  unpaidContracts: Array<{
    contractId: number;
    property: {
      id: number;
      code: string;
      name: string;
    };
    tenant: {
      id: number;
      fullName: string;
      phone: string;
    };
    rentAmount: string;
    startDate: string;
    endDate: string;
    dueDate: string;
    /** Estimasi denda keterlambatan berjalan (belum final, belum ada payment) */
    estimatedLateFee: number;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  status: number;
}
