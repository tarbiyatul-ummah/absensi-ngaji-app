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

export interface Attendance {
  id: string; // Format: YYYY-MM-DD_santriId
  date: string;
  santriId: string;
  jilidId: string;
  guruId: string;
  isPresent: boolean;
}
