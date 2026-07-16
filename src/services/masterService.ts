import { getCurrentUserId, supabase } from "./supabase";
import type { Guru, Jilid, Santri, SantriType } from "../types";

const TABLES = {
  classes: "classes",
  teachers: "teachers",
  studentTypes: "student_types",
  students: "students",
} as const;

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const mapClass = (row: any): Jilid => ({
  id: row.id,
  nama: row.nama,
  urutan: row.urutan ?? 0,
});

const mapTeacher = (row: any): Guru => ({
  id: row.id,
  nama: row.nama,
});

const mapStudentType = (row: any): SantriType => ({
  id: row.id,
  nama: row.nama,
  createdAt: row.created_at ?? undefined,
});

const mapStudent = (row: any): Santri => ({
  id: row.id,
  nama: row.nama,
  jilidId: row.jilid_id,
  guruId: row.guru_id,
  tipeId: row.tipe_id ?? undefined,
  tanggalLahir: row.tanggal_lahir ?? undefined,
  isActive: row.is_active,
  createdAt: row.created_at,
});

// --- Kelas & Guru ---
export const getJilid = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(TABLES.classes)
    .select("id,nama,urutan")
    .eq("user_id", userId)
    .order("urutan", { ascending: true });

  throwIfError(error);
  return (data ?? []).map(mapClass);
};

export const getGuru = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(TABLES.teachers)
    .select("id,nama")
    .eq("user_id", userId)
    .order("nama", { ascending: true });

  throwIfError(error);
  return (data ?? []).map(mapTeacher);
};

// --- Tipe Siswa ---
export const getSantriTypes = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(TABLES.studentTypes)
    .select("id,nama,created_at")
    .eq("user_id", userId)
    .order("nama", { ascending: true });

  throwIfError(error);
  return (data ?? []).map(mapStudentType);
};

// --- Siswa ---
export const getSantri = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(TABLES.students)
    .select(
      "id,nama,jilid_id,guru_id,tipe_id,tanggal_lahir,is_active,created_at",
    )
    .eq("user_id", userId);

  throwIfError(error);
  return (data ?? []).map(mapStudent);
};

export interface SantriBulkItem {
  nama: string;
  jilidId: string;
  guruId: string;
  tipeId?: string;
  tanggalLahir?: string;
  isActive?: boolean;
}

export const addSantriBulk = async (
  namaInput: string,
  jilidId: string,
  guruId: string,
  tipeId?: string,
  tanggalLahir?: string,
) => {
  const userId = await getCurrentUserId();
  const createdAt = Date.now();
  const rows = namaInput
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n !== "")
    .map((nama) => ({
      user_id: userId,
      nama,
      jilid_id: jilidId,
      guru_id: guruId,
      tipe_id: tipeId || null,
      tanggal_lahir: tanggalLahir || null,
      is_active: true,
      created_at: createdAt,
    }));

  if (rows.length === 0) return;

  const { error } = await supabase.from(TABLES.students).insert(rows);
  throwIfError(error);
};

export const addSantriItems = async (items: SantriBulkItem[]) => {
  const userId = await getCurrentUserId();
  const createdAt = Date.now();
  const rows = items.map((item) => ({
    user_id: userId,
    nama: item.nama,
    jilid_id: item.jilidId,
    guru_id: item.guruId,
    tipe_id: item.tipeId || null,
    tanggal_lahir: item.tanggalLahir || null,
    is_active: item.isActive ?? true,
    created_at: createdAt,
  }));

  if (rows.length === 0) return;

  const { error } = await supabase.from(TABLES.students).insert(rows);
  throwIfError(error);
};

export const updateSantri = async (id: string, data: Partial<Santri>) => {
  const userId = await getCurrentUserId();
  const payload: Record<string, unknown> = {};

  if ("nama" in data) payload.nama = data.nama;
  if ("jilidId" in data) payload.jilid_id = data.jilidId;
  if ("guruId" in data) payload.guru_id = data.guruId;
  if ("tipeId" in data) payload.tipe_id = data.tipeId || null;
  if ("tanggalLahir" in data) {
    payload.tanggal_lahir = data.tanggalLahir || null;
  }
  if ("isActive" in data) payload.is_active = data.isActive;

  const { error } = await supabase
    .from(TABLES.students)
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);
};

export const deleteSantri = async (id: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(TABLES.students)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);
};

// --- CRUD Kelas ---
export const addJilid = async (nama: string) => {
  const userId = await getCurrentUserId();
  const currentList = await getJilid();
  const maxUrutan =
    currentList.length > 0 ? Math.max(...currentList.map((j) => j.urutan)) : 0;
  const { error } = await supabase.from(TABLES.classes).insert({
    user_id: userId,
    nama,
    urutan: maxUrutan + 1,
  });

  throwIfError(error);
};

export const swapUrutanJilid = async (
  id1: string,
  urutan1: number,
  id2: string,
  urutan2: number,
) => {
  const userId = await getCurrentUserId();
  const first = await supabase
    .from(TABLES.classes)
    .update({ urutan: urutan2 })
    .eq("id", id1)
    .eq("user_id", userId);
  const second = await supabase
    .from(TABLES.classes)
    .update({ urutan: urutan1 })
    .eq("id", id2)
    .eq("user_id", userId);

  throwIfError(first.error);
  throwIfError(second.error);
};

export const updateJilid = async (id: string, nama: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(TABLES.classes)
    .update({ nama })
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);
};

export const deleteJilid = async (id: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(TABLES.classes)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);
};

// --- CRUD Guru ---
export const addGuru = async (nama: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from(TABLES.teachers).insert({
    user_id: userId,
    nama,
  });

  throwIfError(error);
};

export const updateGuru = async (id: string, nama: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(TABLES.teachers)
    .update({ nama })
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);
};

export const deleteGuru = async (id: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(TABLES.teachers)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);
};

// --- CRUD Tipe Siswa ---
export const addSantriType = async (nama: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from(TABLES.studentTypes).insert({
    user_id: userId,
    nama,
    created_at: Date.now(),
  });

  throwIfError(error);
};

export const updateSantriType = async (id: string, nama: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(TABLES.studentTypes)
    .update({ nama })
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);
};

export const deleteSantriType = async (id: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(TABLES.studentTypes)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  throwIfError(error);
};
