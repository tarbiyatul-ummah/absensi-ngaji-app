export interface Jilid {
  id: string;
  nama: string;
  urutan: number;
}

export interface Guru {
  id: string;
  nama: string;
}

export interface SantriType {
  id: string;
  nama: string;
  createdAt?: number;
}

export interface Santri {
  id: string;
  nama: string;
  jilidId: string;
  guruId: string;
  tipeId?: string;
  tanggalLahir?: string; // Format: YYYY-MM-DD
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

export interface AcademicYear {
  id: string;
  startYear: number;
  isActive: boolean;
  createdAt: number;
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

export type SavingsAccountFormData = Omit<
  SavingsAccount,
  "id" | "createdAt" | "updatedAt"
>;

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

export type AssessmentItemType = "score" | "scale";

export interface AssessmentItem {
  id: string;
  assessmentId: string;
  label: string;
  assessmentType: AssessmentItemType;
  maxScore: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface AssessmentParticipant {
  id: string;
  assessmentId: string;
  santriId: string;
  createdAt: number;
}

export interface AssessmentScore {
  id: string;
  assessmentId: string;
  santriId: string;
  assessmentItemId: string;
  score: number;
  createdAt: number;
  updatedAt: number;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  santriId: string;
  notes?: string;
  submittedAt: number;
  updatedAt: number;
  scores: AssessmentScore[];
}

export interface Assessment {
  id: string;
  name: string;
  assessmentType: AssessmentItemType;
  minimumScore: number;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  items: AssessmentItem[];
  participants: AssessmentParticipant[];
  results: AssessmentResult[];
}

export interface AssessmentFormItem {
  id?: string;
  label: string;
}

export interface AssessmentFormData {
  name: string;
  assessmentType: AssessmentItemType;
  minimumScore: number;
  items: AssessmentFormItem[];
  santriIds: string[];
}
