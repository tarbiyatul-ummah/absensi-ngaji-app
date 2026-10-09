# Plan Design System: Atomic Architecture & Design Tokens
**Project:** Absensi Ngaji App  
**Architecture:** Atomic Design System & Tailwind CSS v4 Token Engine  
**Author:** AI Agent (Autonomous System Architect)  
**Date:** Oktober 2026  

---

## 1. Executive Summary & Objective

Tujuan dari perancangan **Design System** ini adalah mentransformasi antarmuka aplikasi *Absensi Ngaji App* dari pendekatan styling ad-hoc (inline HSL, kelas utility acak, ukuran radius & padding yang bervariasi) menjadi sebuah **Design System komprehensif, terstruktur, dan skalabel**.

Sistem ini mengadopsi **Atomic Design Principles** yang diintegrasikan langsung dengan **Tailwind CSS v4 Token Engine** (`@theme` dan CSS Variables). Setiap keputusan desain (corner radius, padding/spacing, warna fungsional, tipografi, line height, dan shadow) didefinisikan secara eksplisit sebagai **Design Tokens**, yang kemudian diwariskan ke:
1. **Design Tokens (Foundations)**
2. **Atoms (Komponen Primitif)**
3. **Molecules (Komponen Komposit Kecil)**
4. **Organisms (Komponen UI Kompleks)**
5. **Templates (Tata Letak / Layout Standar)**
6. **Pages (Halaman Aplikasi Nyata)**

---

## 2. Design Tokens Foundation (Atoms Groundwork)

```
                    ┌───────────────────────────┐
                    │       DESIGN TOKENS       │
                    │ Colors • Radii • Spacing  │
                    │ Typography • Elevation    │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┴───────────────────────┐
          ▼                                               ▼
┌──────────────────┐                            ┌───────────────────┐
│      ATOMS       │                            │     MOLECULES     │
│ Button  • Badge  │ ────── builds into ──────► │ Select • Search   │
│ Input   • Label  │                            │ StatCard • Toast  │
│ Card    • Avatar │                            │ ConfirmModal      │
└─────────┬────────┘                            └─────────┬─────────┘
          │                                               │
          └───────────────────────┬───────────────────────┘
                                  ▼
                        ┌───────────────────┐
                        │     ORGANISMS     │
                        │ AppSidebar        │
                        │ MobileBottomNav   │
                        │ DataTable         │
                        │ MasterDataSummary │
                        └─────────┬─────────┘
                                  ▼
                        ┌───────────────────┐
                        │ TEMPLATES & PAGES │
                        │ MasterSantri      │
                        │ FinanceView       │
                        │ DashboardView     │
                        │ AbsensiView       │
                        └───────────────────┘
```

---

### 2.1 Color Tokens (Semantic & Functional Palette)

Seluruh warna dikelompokkan ke dalam 4 tingkatan semantik: **Surface/Neutral**, **Brand/Primary**, **Semantic Status (Success, Warning, Danger, Info)**, dan **Data Visualization**. Tidak lagi menggunakan kode HSL arbitrary di komponen JSX.

| Token CSS Variable | Tailwind Utility Token | Nilai Light Mode | Nilai Dark Mode | Penggunaan / Peruntukan |
| :--- | :--- | :--- | :--- | :--- |
| `--color-background` | `bg-background` | `hsl(0 0% 100%)` | `hsl(222.2 84% 4.9%)` | Latar belakang kanvas aplikasi |
| `--color-foreground` | `text-foreground` | `hsl(222.2 84% 4.9%)` | `hsl(210 40% 98%)` | Teks utama aplikasi |
| `--color-card` | `bg-card` | `hsl(0 0% 100%)` | `hsl(222.2 84% 7%)` | Latar kartu, popover, dialog |
| `--color-card-foreground`| `text-card-foreground`| `hsl(222.2 84% 4.9%)`| `hsl(210 40% 98%)` | Teks di dalam kartu |
| `--color-muted` | `bg-muted` | `hsl(210 40% 96.1%)` | `hsl(217.2 32.6% 17.5%)`| Background sekunder, tab track |
| `--color-muted-foreground`| `text-muted-foreground`| `hsl(215.4 16.3% 46.9%)`| `hsl(215 20.2% 65.1%)` | Label redup, subtitle, placeholder |
| `--color-border` | `border-border` | `hsl(214.3 31.8% 91.4%)`| `hsl(217.2 32.6% 17.5%)`| Border kartu, pembatas, divider |
| `--color-input` | `border-input` | `hsl(214.3 31.8% 91.4%)`| `hsl(217.2 32.6% 22%)` | Border kontrol input / select |
| `--color-primary` | `bg-primary` | `hsl(222.2 47.4% 11.2%)`| `hsl(210 40% 98%)` | Tombol CTA utama, badge utama |
| `--color-primary-foreground`| `text-primary-foreground`| `hsl(210 40% 98%)` | `hsl(222.2 47.4% 11.2%)`| Teks di atas warna primary |
| **`--color-success-subtle`** | `bg-success-subtle` | `hsl(142 76% 95%)` | `hsl(142 60% 14%)` | Badge Lunas, Hadir, status aktif |
| **`--color-success-text`** | `text-success` | `hsl(142 72% 28%)` | `hsl(142 70% 75%)` | Teks Lunas, Hadir, angka positif |
| **`--color-success-border`**| `border-success-border`| `hsl(142 42% 82%)`| `hsl(142 40% 25%)` | Border badge Lunas / Hadir |
| **`--color-warning-subtle`** | `bg-warning-subtle` | `hsl(48 96% 92%)` | `hsl(48 60% 14%)` | Badge Izin, pending, warning |
| **`--color-warning-text`** | `text-warning` | `hsl(32 95% 34%)` | `hsl(43 96% 72%)` | Teks Izin, status perhatian |
| **`--color-warning-border`**| `border-warning-border`| `hsl(48 76% 78%)` | `hsl(48 40% 25%)` | Border badge Izin |
| **`--color-danger-subtle`** | `bg-danger-subtle` | `hsl(354 85% 96%)` | `hsl(354 60% 16%)` | Badge Belum Bayar, nonaktif |
| **`--color-danger-text`** | `text-danger` | `hsl(354 70% 42%)` | `hsl(354 85% 80%)` | Teks Belum Bayar, error, tunggakan |
| **`--color-danger-border`**| `border-danger-border` | `hsl(354 70% 88%)` | `hsl(354 40% 28%)` | Border badge Belum Bayar / Tunggakan |

---

### 2.2 Corner Radius Tokens

Radius diatur menggunakan skala hierarki yang konsisten, mulai dari badge kecil hingga dialog modal besar:

| Token CSS Variable | Tailwind Utility | Nilai (px / rem) | Contoh Penerapan Komponen |
| :--- | :--- | :--- | :--- |
| `--radius-none` | `rounded-none` | `0px` | Elemen edge-to-edge |
| `--radius-xs` | `rounded-xs` | `4px / 0.25rem` | Kbd, status indicator dot |
| `--radius-sm` | `rounded-sm` | `6px / 0.375rem` | Tag kecil, checkbox, tooltip |
| `--radius-md` | `rounded-md` | `8px / 0.5rem` | Input text, select trigger, menu button |
| `--radius-lg` | `rounded-lg` | `10px / 0.625rem` | Dropdown item, segmented tab, table action |
| **`--radius-xl` (Default)** | **`rounded-xl`** | **`12px / 0.75rem`** | **Card, Dropdown Popover, StatCard, Sidebar Button** |
| `--radius-2xl` | `rounded-2xl` | `16px / 1rem` | Dialog Modal, Alert Box, Bottom Sheet |
| `--radius-full` | `rounded-full` | `9999px` | Badge / Pills (Lunas, Belum Bayar), Avatar |

---

### 2.3 Spacing & Padding Tokens (Modular 4px Grid)

Semua layout margin, padding komponen, dan gap grid mengikuti skala kelipatan 4px:

| Token Spacing | Nilai px / rem | Penggunaan Standar di Aplikasi |
| :--- | :--- | :--- |
| `space-1` | `4px / 0.25rem` | Padding internal popover, gap antar tag mikro |
| `space-1.5` | `6px / 0.375rem`| Vertical padding badge, icon button kecil |
| `space-2` | `8px / 0.5rem` | Padding elemen interaktif kecil, gap menu item |
| `space-2.5` | `10px / 0.625rem`| Padding tombol ukuran `sm`, input `py-2.5` |
| `space-3` | `12px / 0.75rem` | Padding tombol ukuran `default`, padding card mobile |
| `space-4` | `16px / 1rem` | Padding standar card desktop, form gap standar |
| `space-5` | `20px / 1.25rem`| Gap antar section card pada halaman |
| `space-6` | `24px / 1.5rem` | Padding header card, padding modal dialog |
| `space-8` | `32px / 2rem` | Page container horizontal padding desktop |
| `space-10` | `40px / 2.5rem`| Top padding page container |
| `space-16` | `64px / 4rem` | Bottom spacer untuk mengakomodasi mobile bottom nav |

---

### 2.4 Typography Tokens (Font Family, Size, Line Height, Weights)

Aplikasi menggunakan **Inter** sebagai UI font primer dengan rendering text `antialiased`, dipadukan dengan **Geist Variable** untuk display/heading elegan.

| Token Typography | Font Size | Line Height | Weight | Penggunaan Komponen |
| :--- | :--- | :--- | :--- | :--- |
| `font-display-2xl` | `30px / 1.875rem` | `1.25 (38px)` | `Bold (700)` | Angka metrik utama (Total Santri, Kas) |
| `font-display-xl` | `24px / 1.5rem` | `1.25 (30px)` | `SemiBold (600)` | Judul utama halaman (`app-title`) |
| `font-heading-lg` | `20px / 1.25rem` | `1.35 (28px)` | `SemiBold (600)` | Judul dialog modal, sub-heading halaman |
| `font-heading-md` | `16px / 1rem` | `1.4 (24px)` | `SemiBold (600)` | Judul kartu (`CardTitle`), tabel header |
| `font-body-md` | `14px / 0.875rem` | `1.5 (21px)` | `Regular (400)` | Teks isi standar, nilai baris tabel, deskripsi |
| `font-body-sm` | `13px / 0.8125rem`| `1.5 (20px)` | `Medium (500)` | Input form, dropdown trigger, tombol |
| `font-caption-sm` | `12px / 0.75rem` | `1.4 (16px)` | `Regular / Medium`| Label input, subtitle kartu, hint teks |
| `font-caption-xs` | `10px / 0.625rem` | `1.3 (14px)` | `Medium / SemiBold`| Badge status (Lunas, Belum Bayar), cap waktu |

---

### 2.5 Shadows & Elevation Tokens

| Token Shadow | Definisi Shadow | Penggunaan Komponen |
| :--- | :--- | :--- |
| `shadow-none` | `none` | Flat elements, inline pills, embedded tables |
| `shadow-2xs` | `0 1px 2px 0 rgb(0 0 0 / 0.04)` | Button, input field normal state |
| `shadow-xs` | `0 1px 3px 0 rgb(0 0 0 / 0.06)` | Segmented button active state, StatCard |
| `shadow-sm` | `0 2px 4px -1px rgb(0 0 0 / 0.06)` | Hover state pada kartu interaktif |
| **`shadow-lg`** | `0 10px 15px -3px rgb(0 0 0 / 0.08)` | Modal Dialog, Bottom Nav floating blur |
| **`shadow-xl`** | `0 20px 25px -5px rgb(0 0 0 / 0.10)` | Floating Dropdown Popover, User Account Menu |

---

## 3. Atomic Hierarchy Implementation Plan

### 3.1 Atoms (Komponen Primitif)
1. **`Button` (`src/components/ui/button.tsx`)**:
   - Varian standar: `primary`, `secondary`, `outline`, `ghost`, `destructive`, `success`.
   - Ukuran konsisten: `xs` (24px), `sm` (32px), `md` (36px), `lg` (44px), `icon` (36x36px).
   - Corner radius: `rounded-xl`.
2. **`Badge` (`src/components/ui/badge.tsx`)**:
   - Varian semantik soft-pill: `success` (Lunas/Hadir), `warning` (Izin/Pending), `danger` (Belum Bayar/Tunggakan), `neutral` (Belum Masuk/Muted).
   - Format: `rounded-full text-[10px] font-medium border px-2.5 py-0.5 shadow-none`.
3. **`Input` & `Textarea` (`src/components/ui/input.tsx`, `textarea.tsx`)**:
   - Sudut `rounded-xl`, border `border-input`, transition focus dengan ring yang lembut.
4. **`Label` (`src/components/ui/label.tsx`)**:
   - Standar `text-xs font-semibold text-foreground` dengan konsistensi margin bottom.
5. **`Card` Primitif (`src/components/ui/card.tsx`)**:
   - Container `rounded-xl border border-border bg-card shadow-xs`.

### 3.2 Molecules (Komponen Komposit Kecil)
1. **`Select` / Dropdown (`src/components/ui/select.tsx`)**:
   - Trigger: `rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium`.
   - Content: Floating card `rounded-xl border border-border bg-card p-1.5 shadow-xl min-w-[8.5rem]`.
   - Items: `rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-accent/70`.
2. **`SearchInput` (`src/components/ui/search-input.tsx` - [NEW])**:
   - Input pencarian standar yang menyatukan search icon di kiri, clear button di kanan, dan debounce.
3. **`StatCard` (`src/components/dashboard/StatisticCard.tsx`)**:
   - Komponen metrik ringkasan KPI yang mengonsumsi token `font-display-2xl`, title `font-caption-sm`, dan badge pendukung.
4. **`FilterChip` (`src/components/ui/filter-chip.tsx` - [NEW])**:
   - Pill interaktif untuk filter kategori (seperti filter Jilid pada AbsensiView).
5. **`Toast` (`src/components/master/Toast.tsx`)**:
   - Alert popup floating dengan token animasi motion `springSnappy`, `rounded-xl`, dan `shadow-lg`.

### 3.3 Organisms (Komponen UI Kompleks)
1. **`AppSidebar` (`src/components/layout/AppSidebar.tsx`)**:
   - Sidebar desktop edge-to-edge docked dengan navigasi 4 menu utama, logo branding, dan Lucy Bond profile popover card.
2. **`MobileBottomNav` (`src/components/layout/MobileBottomNav.tsx`)**:
   - Bottom bar 4 menu dengan tactile touch feedback dan safe area insets.
3. **`DataTable` Standardized (`src/components/ui/data-table.tsx` - [NEW])**:
   - Template tabel seragam untuk Data Santri, Rekap SPP Desktop, dan Nilai.
   - Kolom nama siswa sticky di kiri, border divide halus, hover row accent, dan header muted.
4. **`MasterDataSummary` (`src/components/master/MasterDataSummary.tsx`)**:
   - Tampilan desktop segmented button tabs + tampilan mobile compact popover dropdown.
5. **Modal Dialogs (`src/components/ui/dialog.tsx` & modals terkait)**:
   - Dialog overlay dengan backdrop blur halus, card container `rounded-2xl shadow-xl`.

### 3.4 Templates & Layouts
1. **`AppLayout` (`src/components/layout/AppLayout.tsx`)**:
   - Penataan grid desktop edge-to-edge + viewport mobile dengan bottom bar.
2. **`PageHeader` (`src/components/layout/PageHeader.tsx` - [NEW])**:
   - Menyeragamkan header setiap halaman (judul, subtitle/tahun ajaran, tombol aksi ekspor/tambah).

---

## 4. Rincian Perubahan File & Struktur Proyek

### Folder Struktur Baru yang Diusulkan:
```
src/
├── design-system/                  [NEW FOLDER]
│   ├── tokens.ts                   -> Definisi token TypeScript (colors, radii, spacing, typography)
│   ├── index.ts                    -> Export barrel untuk design system
│   └── docs.md                     -> Dokumentasi referensi cepat bagi developer
├── assets/
│   └── main.css                    -> Mengintegrasikan @theme Tailwind v4 dan CSS Variables
├── components/
│   ├── ui/                         -> Atoms & Molecules dasar
│   │   ├── badge.tsx               -> [MODIFY] Update token semantik success/warning/danger
│   │   ├── button.tsx              -> [MODIFY] Standarisasi radius & ukuran
│   │   ├── card.tsx                -> [MODIFY] Standarisasi border & shadow
│   │   ├── dialog.tsx              -> [MODIFY] Standarisasi rounded-2xl & overlay blur
│   │   ├── select.tsx              -> [MAINTAIN] Menjaga styling popover ala akun
│   │   ├── search-input.tsx        -> [NEW] Search input molekul
│   │   ├── filter-chip.tsx         -> [NEW] Pill filter molekul
│   │   └── data-table.tsx          -> [NEW] Organism tabel terstandarisasi
│   ├── layout/
│   │   ├── AppLayout.tsx           -> [MODIFY] Konsistensi spacing container
│   │   ├── AppSidebar.tsx          -> [MODIFY] Penyelarasan token
│   │   ├── MobileBottomNav.tsx     -> [MODIFY] Penyelarasan token
│   │   └── PageHeader.tsx          -> [NEW] Template header halaman
│   └── ...
└── views/                          -> Penyelarasan ke-11 views aplikasi
    ├── AbsensiView.tsx             -> Adopsi token warna kehadiran (Hadir/Izin/Belum)
    ├── MasterSantri.tsx            -> Adopsi DataTable & PageHeader
    ├── FinanceView.tsx             -> Adopsi token status SPP & popover
    ├── DashboardView.tsx           -> Adopsi StatCard & token metrik
    ├── AssessmentView.tsx          -> Adopsi Select & form controls
    ├── ExportView.tsx              -> Adopsi form tokens
    ├── SavingsView.tsx             -> Adopsi token nominal & tabel
    ├── SavingsDetailView.tsx       -> Adopsi token kartu tabungan
    ├── AccountView.tsx             -> Adopsi token pengaturan
    ├── LoginView.tsx               -> Adopsi card & form tokens
    └── OrganizationTermsView.tsx   -> Adopsi form tokens
```

---

## 5. Rencana Eksekusi Bertahap (Execution Phases)

### Fase 1: Membangun Token Engine (`main.css` & `tokens.ts`)
1. Definisikan blok `@theme` di Tailwind CSS v4 (`src/assets/main.css`) mencakup semua warna semantik, radius, dan tipografi.
2. Buat file `src/design-system/tokens.ts` sebagai *single source of truth* untuk penggunaan token di JavaScript/TypeScript (misalnya untuk konfigurasi grafik Radar Chart, PDF report, atau style dinamis).

### Fase 2: Standarisasi Atoms & Molecules
1. Perbarui komponen `Badge` untuk mendukung varian semantik: `success`, `warning`, `danger`, `neutral`, `outline`.
2. Perbarui komponen `Button` untuk mendukung size tokens dan radius tokens.
3. Buat molekul baru: `SearchInput` dan `FilterChip`.
4. Pastikan `Select` tetap mempertahankan floating card popover yang sudah disukai pengguna.

### Fase 3: Standarisasi Organisms & Templates
1. Buat template `PageHeader` untuk menyeragamkan judul halaman, subtitle, dan tombol aksi.
2. Buat komponen `DataTable` untuk merapikan tabel desktop di semua halaman.
3. Selaraskan `AppSidebar` dan `MobileBottomNav` agar menggunakan token spasi dan warna yang sama.

### Fase 4: Refactoring Halaman (Views Migration)
1. **`FinanceView.tsx`**: Ganti inline HSL badge dengan token semantik badge (`variant="success"`, `variant="danger"`, `variant="neutral"`).
2. **`AbsensiView.tsx`**: Ganti warna manual pada kartu ringkasan (Hadir/Izin) dengan token `bg-success-subtle`, `text-success`, `bg-warning-subtle`, dll.
3. **`DashboardView.tsx`**: Terapkan komponen `StatCard` dan token tipografi heading.
4. **`MasterSantri.tsx`**: Terapkan `PageHeader` dan `DataTable`.
5. **Views lainnya**: Audit dan ganti semua inline font size `text-[11px]`, `text-[13px]`, radius acak menjadi token desain terpadu.

### Fase 5: Verifikasi & QA
1. **Automated Verification**: Jalankan `npm run build` untuk memverifikasi TypeScript dan Vite compiler.
2. **Theme Consistency Check**: Uji Light Mode dan Dark Mode untuk memastikan semua token memiliki kontras yang terbaca (WCAG AA compliant).
3. **Responsiveness Check**: Uji breakpoint Desktop (`1024px+`), Tablet (`768px - 1023px`), dan Mobile (`< 768px`).

---

## 6. Verifikasi & Pengujian

### Uji Otomatis:
```bash
npm run build
```
Memastikan tidak ada error compile, linting, atau kegagalan import modul.

### Uji Visual & Manual:
1. **Dropdown & Popover**: Klik filter analitik di mobile dan menu profil Lucy Bond di sidebar untuk memverifikasi keidentikan style floating card.
2. **Badge Status**: Cek badge Lunas (soft mint), Belum Bayar (soft rose), dan Belum Masuk (soft gray) pada popup detail pembayaran.
3. **Responsivitas**: Periksa bottom nav di mobile dan sidebar edge-to-edge di desktop.
4. **Dark Mode**: Beralih tema gelap/terang dan pastikan tidak ada teks yang hilang atau kontras yang pecah.

---
*Dokumen ini disimpan sebagai `plan-design-system.md` dan siap dieksekusi setelah mendapatkan persetujuan pengguna.*

