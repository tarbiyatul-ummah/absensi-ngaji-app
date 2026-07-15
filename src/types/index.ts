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
