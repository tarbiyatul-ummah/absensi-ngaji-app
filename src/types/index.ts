export interface Jilid {
  id: string;
  nama: string;
  urutan: number;
}

export interface Guru {
  id: string;
  nama: string;
}

export interface Santri {
  id: string;
  nama: string;
  jilidId: string;
  guruId: string;
  isActive: boolean;
  createdAt: number;
}

export type AttendanceStatus = "present" | "permission" | "absent";

export interface Attendance {
  id: string; // Format: YYYY-MM-DD_santriId
  date: string;
  santriId: string;
  jilidId: string;
  guruId: string;
  isPresent: boolean;
  status?: AttendanceStatus;
}

export interface SppPayment {
  id: string; // Format: academicYearStart_month_santriId
  santriId: string;
  academicYearStart: number;
  month: string; // Format: YYYY-MM
  isPaid: boolean;
  paidAt?: number | null;
  updatedAt: number;
}

export type SavingsAccountMode = "monthly";
export type SavingsAccountSemester = "ganjil" | "genap";

export interface SavingsAccount {
  id: string;
  name: string;
  academicYearStart: number;
  semester: SavingsAccountSemester;
  mode: SavingsAccountMode;
  santriIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SavingsPayment {
  id: string; // Format: savingsAccountId_month_santriId
  savingsAccountId: string;
  santriId: string;
  academicYearStart: number;
  semester: SavingsAccountSemester;
  month: string; // Format: YYYY-MM
  isPaid: boolean;
  paidAt?: number | null;
  updatedAt: number;
}
