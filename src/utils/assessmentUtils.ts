import type { AssessmentItemType } from "../types";

export interface QualitativeGrade {
  score: number;
  grade: string;
  desc: string;
  fullLabel: string;
}

export const QUALITATIVE_GRADES: readonly QualitativeGrade[] = [
  { score: 4, grade: "A", desc: "Sangat Baik", fullLabel: "A (Sangat Baik)" },
  { score: 3, grade: "B", desc: "Baik", fullLabel: "B (Baik)" },
  { score: 2, grade: "C", desc: "Cukup", fullLabel: "C (Cukup)" },
  { score: 1, grade: "D", desc: "Kurang", fullLabel: "D (Kurang)" },
] as const;

export const getQualitativeGrade = (score: number): string => {
  if (score >= 3.5) return "A";
  if (score >= 2.5) return "B";
  if (score >= 1.5) return "C";
  if (score >= 0.5) return "D";
  return "-";
};

export const getQualitativeLabel = (score: number): string => {
  if (score >= 3.5) return "A (Sangat Baik)";
  if (score >= 2.5) return "B (Baik)";
  if (score >= 1.5) return "C (Cukup)";
  if (score >= 0.5) return "D (Kurang)";
  return "-";
};

export const getScoreDisplay = (
  score: number,
  maxScore: number,
  type?: AssessmentItemType
): string => {
  if (type === "qualitative" || maxScore === 4) {
    return getQualitativeLabel(score);
  }
  return `${score}/${maxScore}`;
};

export const getAssessmentTypeLabel = (type: AssessmentItemType): string => {
  switch (type) {
    case "qualitative":
      return "Kualitatif (A, B, C, D)";
    case "scale":
      return "Skala Rating (1-5)";
    case "score":
    default:
      return "Nilai Angka (0-100)";
  }
};

// ==============================================================================
// Preset Kategori Pembelajaran Harian (Multi-Bidang: Tilawah, Hafalan, Doa, Ibadah, Diniyah)
// ==============================================================================

export interface DailyCategoryPreset {
  id: string;
  name: string;
  icon: string;
  defaultAspects: string[];
  placeholderMateri: string;
}

export const DAILY_CATEGORY_PRESETS: readonly DailyCategoryPreset[] = [
  {
    id: "tilawah_iqro",
    name: "Tilawah & Iqro",
    icon: "📖",
    defaultAspects: [
      "Makharijul Huruf",
      "Tajwid",
      "Kelancaran / Tartil",
      "Adab & Kerajinan",
    ],
    placeholderMateri: "Contoh: Iqro 3 Hal 15 atau QS. Al-Baqarah 1-15",
  },
  {
    id: "hafalan_tahfidz",
    name: "Hafalan / Tahfidz",
    icon: "🧠",
    defaultAspects: [
      "Kelancaran Hafalan",
      "Tajwid & Makhraj",
      "Ketepatan Ayat",
      "Adab",
    ],
    placeholderMateri: "Contoh: Surat An-Naba ayat 1-20 atau Juz 30",
  },
  {
    id: "doa_hadits",
    name: "Doa & Hadits",
    icon: "🤲",
    defaultAspects: [
      "Kelancaran Lafadz",
      "Fasohah & Makhraj",
      "Pemahaman Makna",
      "Adab Berdoa",
    ],
    placeholderMateri: "Contoh: Doa Masuk Masjid & Hadits Menuntut Ilmu",
  },
  {
    id: "praktek_ibadah",
    name: "Praktek Ibadah",
    icon: "🕌",
    defaultAspects: [
      "Ketepatan Gerakan",
      "Bacaan Ibadah",
      "Tumakninah & Khusyuk",
      "Kerapian & Adab",
    ],
    placeholderMateri: "Contoh: Praktek Sholat Subuh / Tata Cara Wudhu",
  },
  {
    id: "diniyah_materi",
    name: "Materi / Diniyah",
    icon: "📚",
    defaultAspects: [
      "Pemahaman Materi",
      "Keaktifan & Diskusi",
      "Kelengkapan Catatan",
      "Ketertiban",
    ],
    placeholderMateri: "Contoh: Fiqih Bab Bersuci / Sirah Nabawiyah",
  },
  {
    id: "kustom",
    name: "Kustom / Bebas",
    icon: "✏️",
    defaultAspects: ["Penguasaan Materi", "Kerapian & Adab"],
    placeholderMateri: "Tuliskan materi pembelajaran hari ini...",
  },
] as const;

export const DEFAULT_DAILY_ASPECTS = DAILY_CATEGORY_PRESETS[0].defaultAspects;

// Bank Saran Catatan Cepat (Quick Suggestion Chips) per Aspek
export const QUICK_NOTE_CHIPS: Record<string, string[]> = {
  // Tilawah & Iqro
  "Makharijul Huruf": [
    "Makhraj tepat",
    "Huruf 'Ain & Hamzah tertukar",
    "Latihan huruf tebal (isti'la)",
    "Makhraj tenggorokan perlu dilatih",
    "Pelafalan sudah sangat fasih",
  ],
  Tajwid: [
    "Hukum mad tepat",
    "Perhatikan dengung (ikhfa/idgham)",
    "Ghunnah kurang lama",
    "Waqaf & ibtida tepat",
    "Kaidah tajwid dipahami dengan baik",
  ],
  "Kelancaran / Tartil": [
    "Sangat lancar & tartil",
    "Cukup lancar, tempo baik",
    "Masih terbata-bata",
    "Perlu diulang di halaman ini",
    "Bagus, lanjut halaman berikutnya",
  ],
  // Hafalan / Tahfidz
  "Kelancaran Hafalan": [
    "Mutqin / sangat lancar",
    "Lancar dengan sedikit pengingat",
    "Sering terhenti / lupa awal ayat",
    "Perlu muraja'ah mandiri di rumah",
    "Bagus, siap setoran ayat baru",
  ],
  "Tajwid & Makhraj": [
    "Tajwid & makhraj tetap terjaga saat menghafal",
    "Perhatikan mad panjang saat hafalan",
    "Hati-hati harakat akhir ayat",
  ],
  "Ketepatan Ayat": [
    "Urutan ayat sangat tepat tanpa ragu",
    "Ada ayat yang tertukar / terlewat",
    "Sambung ayat sangat responsif",
  ],
  // Doa & Hadits
  "Kelancaran Lafadz": [
    "Hafal lafadz dengan sempurna",
    "Cukup lancar dengan sedikit bantuan",
    "Perlu diulang hafalannya",
  ],
  "Fasohah & Makhraj": [
    "Pengucapan doa fasih dan jelas",
    "Perhatikan tajwid dalam doa",
  ],
  "Pemahaman Makna": [
    "Paham arti dan maksud doa",
    "Cukup memahami kandungan materi",
    "Perlu pendalaman makna",
  ],
  // Praktek Ibadah
  "Ketepatan Gerakan": [
    "Gerakan sempurna sesuai sunnah",
    "Posisi tangan/kaki perlu diluruskan",
    "Ruku' & sujud sudah tepat",
  ],
  "Bacaan Ibadah": [
    "Bacaan sholat/wudhu lancar & jelas",
    "Ada bacaan yang terlupa",
    "Perlu melancarkan doa tasyahud",
  ],
  "Tumakninah & Khusyuk": [
    "Tumakninah & sangat tenang",
    "Gerakan agak terburu-buru",
    "Tertib dan khusyuk",
  ],
  // Materi / Diniyah
  "Keaktifan & Diskusi": [
    "Sangat aktif bertanya & menjawab",
    "Antusias menyimak penjelasan",
    "Perlu lebih aktif dan berani menjawab",
  ],
  "Kelengkapan Catatan": [
    "Catatan rapi dan lengkap",
    "Tugas terselesaikan dengan baik",
  ],
  // Adab & Umum
  "Adab & Kerajinan": [
    "Adab sangat sopan & fokus",
    "Tertib dan antusias",
    "Kurang fokus / bercanda",
    "Disiplin dan menghormati guru",
  ],
  Adab: [
    "Adab sangat sopan & tertib",
    "Fokus dan sungguh-sungguh",
    "Perlu ditingkatkan konsentrasinya",
  ],
  "Penguasaan Materi": [
    "Menguasai materi dengan sangat baik",
    "Cukup menguasai pokok bahasan",
    "Perlu bimbingan lebih lanjut",
  ],
};

export const GENERIC_QUICK_CHIPS: readonly string[] = [
  "Sangat baik & memuaskan",
  "Sudah cukup lancar",
  "Perlu bimbingan dan latihan di rumah",
  "Tingkatkan muraja'ah",
  "Alhamdulillah ada peningkatan yang baik",
] as const;

export const getQuickChipsForAspect = (aspectLabel: string): string[] => {
  const normalized = aspectLabel.toLowerCase().trim();
  for (const [key, chips] of Object.entries(QUICK_NOTE_CHIPS)) {
    if (
      normalized.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(normalized)
    ) {
      return chips;
    }
  }
  return [...GENERIC_QUICK_CHIPS];
};
