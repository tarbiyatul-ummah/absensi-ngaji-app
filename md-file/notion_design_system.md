# Sistem Desain Gaya Notion (Panduan Pembuatan Dashboard)

Dokumen ini adalah panduan komprehensif (_Design System_) yang mengadaptasi estetika, struktur, dan interaksi dari aplikasi **Notion**. Panduan ini dirancang khusus untuk diterapkan pada pembuatan aplikasi **Dashboard** modern yang bersih, fungsional, dan berfokus pada konten.

---

## 1. Filosofi Desain

Sebelum menerapkan kode gaya (CSS), pahami tiga pilar utama desain Notion saat diaplikasikan ke dalam sebuah _dashboard_:

1. **Content-First (Utamakan Konten):** Antarmuka (UI) harus terasa "menghilang". Hindari warna latar yang mencolok, gradasi berlebihan, atau bayangan (_drop shadow_) yang tebal. Biarkan data, tabel, dan grafik menjadi fokus utama.
2. **Warm Minimalism (Minimalis yang Hangat):** Notion tidak menggunakan warna hitam murni (`#000000`) atau abu-abu dingin. Semua warna netralnya memiliki sedikit campuran rona hangat (_warm undertone_ kecokelatan/krem) sehingga nyaman dilihat di mata dalam waktu lama.
3. **Invisible Until Hovered (Tersembunyi Hingga Disentuh):** Tombol aksi, garis batas penggeser (_resizer_), dan menu opsi tambahan sebaiknya disembunyikan atau dibuat sangat samar hingga pengguna mengarahkan kursor (_hover_) ke area tersebut.

---

## 2. Palet Warna (Color Palette)

Kunci utama dari tampilan ala Notion terletak pada pemilihan warna latar, teks, dan warna _tag_ (label status) yang lembut.

### A. Warna Dasar (Light Mode & Dark Mode)

| Elemen UI                  | Light Mode (Hex) | Dark Mode (Hex) | Kegunaan pada Dashboard                                               |
| :------------------------- | :--------------- | :-------------- | :-------------------------------------------------------------------- |
| **Background Primary**     | `#FFFFFF`        | `#191919`       | Area kanvas utama dashboard dan latar kartu (_card_).                 |
| **Background Secondary**   | `#FBFBFA`        | `#202020`       | Latar belakang _Sidebar_, header tabel, atau area _Callout_.          |
| **Background Hover**       | `#F1F1EF`        | `#2C2C2C`       | Warna latar saat baris tabel, menu sidebar, atau tombol di-_hover_.   |
| **Text Primary**           | `#37352F`        | `#D4D4D4`       | Judul halaman, angka metrik utama, dan teks isi.                      |
| **Text Secondary (Muted)** | `#787774`        | `#9B9A97`       | Label kolom, _subtitle_, teks _placeholder_, dan keterangan waktu.    |
| **Text Disabled**          | `#B4B4B0`        | `#5A5A5A`       | Elemen yang tidak aktif atau ikon dekoratif sekunder.                 |
| **Border / Divider**       | `#E9E9E7`        | `#2F2F2F`       | Garis pemisah tabel, tepian kartu (_card border_), dan pemisah seksi. |

> **Tips Pro:** Untuk garis batas (_border_) dan efek _hover_ yang menyatu sempurna dengan latar apa pun, Notion sering menggunakan nilai RGBA transparan:
>
> - **Border Light Mode:** `rgba(55, 53, 47, 0.09)`
> - **Hover Light Mode:** `rgba(55, 53, 47, 0.06)`
> - **Border Dark Mode:** `rgba(255, 255, 255, 0.09)`
> - **Hover Dark Mode:** `rgba(255, 255, 255, 0.055)`

### B. Warna Semantik & Label (Notion Tags / Badges)

Sangat krusial untuk komponen _dashboard_ seperti indikator status proyek, label kategori pada tabel, dan lencana (_badge_).

| Nama Warna         | Teks / Ikon (Light) | Latar Tag (Light) | Latar Tag (Dark) | Kegunaan Semantik Dashboard          |
| :----------------- | :------------------ | :---------------- | :--------------- | :----------------------------------- |
| **Default / Gray** | `#37352F`           | `#E3E2E0`         | `#373737`        | Draft, Diarsipkan, Netral            |
| **Brown**          | `#64473A`           | `#EEE0DA`         | `#43302B`        | Kategori sekunder, Logistik          |
| **Orange**         | `#D9730D`           | `#FADEC9`         | `#593A22`        | Peringatan, Menunggu Review          |
| **Yellow**         | `#DFAB01`           | `#FDECC8`         | `#594A24`        | Sedang Berjalan (_In Progress_)      |
| **Green**          | `#0F7B6C`           | `#DBEDDB`         | `#243D30`        | Selesai (_Completed_), Sukses, Aktif |
| **Blue**           | `#0B6E99`           | `#D3E5EF`         | `#243A4E`        | Informasi, Tugas Baru, Tautan Aktif  |
| **Purple**         | `#6940A5`           | `#E8DEEE`         | `#3C2D49`        | Prioritas Tinggi, Rilis Produk       |
| **Pink**           | `#AD1A72`           | `#F5E0E9`         | `#4E2C3C`        | Desain, Pemasaran, Kreatif           |
| **Red**            | `#E03E3E`           | `#FFE2DD`         | `#592A2A`        | Gagal, Terlambat (_Overdue_), Bahaya |

_Catatan: Untuk komponen tombol aksi utama (Primary CTA seperti tombol "New" pada database), Notion menggunakan warna biru cerah `#2383E2` (hover: `#1B6EC2`) dengan teks putih `#FFFFFF`._

---

## 3. Tipografi (Typography)

Notion menawarkan 3 pilihan gaya huruf, namun untuk aplikasi **Dashboard**, sangat disarankan menggunakan kombinasi **Sans-Serif** (untuk UI dan teks) serta **Monospace** (untuk angka metrik, kode, atau ID transaksi).

### A. Font Family (Font Stack)

- **Sans-Serif (Utama):** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`
- **Monospace (Data & Angka):** `iawriter-mono, Nitti, Menlo, Courier, monospace`
- **Serif (Opsional/Editorial):** `Lyon-Text, Georgia, YuMincho, "Yu Mincho", serif`

### B. Skala & Hierarki Ukuran (Type Scale)

| Elemen              | Ukuran (rem / px) | Ketebalan (Weight) | Line Height | Letter Spacing | Penggunaan pada Dashboard                                       |
| :------------------ | :---------------- | :----------------- | :---------- | :------------- | :-------------------------------------------------------------- |
| **Page Title**      | `2.25rem` (36px)  | `700` (Bold)       | `1.2`       | `-0.02em`      | Judul utama halaman dashboard (di atas kanvas).                 |
| **Heading 1 (H1)**  | `1.875rem` (30px) | `600` (SemiBold)   | `1.3`       | `-0.015em`     | Pemisah seksi utama atau angka metrik raksasa (KPI).            |
| **Heading 2 (H2)**  | `1.5rem` (24px)   | `600` (SemiBold)   | `1.3`       | `-0.01em`      | Judul grup widget atau nama bagian laporan.                     |
| **Heading 3 (H3)**  | `1.25rem` (20px)  | `600` (SemiBold)   | `1.3`       | `-0.005em`     | Judul tabel database atau judul kartu (_card title_).           |
| **Body (Default)**  | `1rem` (16px)     | `400` (Regular)    | `1.5`       | `0`            | Teks paragraf, catatan, dan daftar tugas (_to-do_).             |
| **UI / Table Text** | `0.875rem` (14px) | `400` / `500`      | `1.4`       | `0`            | Isi sel tabel, item navigasi _sidebar_, dan tombol.             |
| **Caption / Tag**   | `0.75rem` (12px)  | `500` (Medium)     | `1.2`       | `0.02em`       | Teks di dalam _badge/tag_, _timestamp_, dan label sumbu grafik. |

---

## 4. Tata Letak & Ruang (Layout & Spacing)

Dashboard bergaya Notion mengandalkan struktur blok modular yang rapi dengan sistem spasi berbasis kelipatan `4px`.

### A. Struktur Kerangka Utama (App Shell)

1. **Sidebar Navigasi (Kiri):**
   - Lebar tetap (_fixed width_): `240px` (dapat diubah ukurannya dari `200px` hingga `360px` atau disembunyikan sepenuhnya).
   - Pemisah kanan: `1px solid` menggunakan warna _Border_.
2. **Topbar / Breadcrumb Header:**
   - Tinggi tetap: `45px`.
   - Menempel di atas (_sticky_), latar belakang menyatu dengan kanvas utama. Berisi jalur _breadcrumb_ di sebelah kiri dan tombol aksi halaman (Share, Favorite, Options) di sebelah kanan.
3. **Area Kanvas Utama (Main View):**
   - **Mode Standar:** Lebar maksimum `900px`, berada di tengah layar (_centered_).
   - **Mode Dashboard (Full Width):** Lebar `100%` dengan _padding_ horizontal sebesar `96px` di layar desktop (`24px` di layar tablet/mobile).

### B. Sistem Grid & Kolom (Multi-Column Blocks)

Untuk menyusun widget dashboard secara berdampingan:

- Gunakan sistem CSS Grid atau Flexbox dengan jarak antar kolom (`gap`) sebesar `16px` hingga `24px`.
- Setiap kolom memiliki _padding_ vertikal internal sebesar `12px`.

---

## 5. Komponen Utama Dashboard (Core Components)

Berikut adalah spesifikasi detail untuk merancang komponen-komponen pembentuk dashboard agar terlihat identik dengan Notion:

### A. Kartu Metrik / KPI (Adaptasi dari "Callout Block")

Di Notion, pengguna membuat kartu informasi metrik menggunakan blok _Callout_.

- **Padding:** `16px` (atau `16px 20px`).
- **Border Radius:** `4px` (atau `6px` untuk tampilan lebih modern).
- **Gaya Latar:** Bisa menggunakan warna latar lembut (misal `#FBFBFA`) tanpa garis batas, **ATAU** latar putih (`#FFFFFF`) dengan garis batas `1px solid rgba(55, 53, 47, 0.12)`.
- **Susunan Konten:** Ikon (ukuran `20px` atau `24px`) di pojok kiri atas atau di samping judul, diikuti oleh label metrik (`14px`, warna _Text Secondary_), dan nilai angka utama (`24px` - `30px`, _Bold_, warna _Text Primary_).

### B. Tabel Data (Database Table View)

- **Header Tabel:** Tinggi baris `34px`, teks rata kiri, ukuran font `12px` atau `14px`, warna _Text Secondary_ (`#787774`), ketebalan `500` (Medium). Dilengkapi ikon kecil (`14px`) di sebelah kiri nama kolom yang menunjukkan tipe data (Teks, Angka, Tanggal, Status).
- **Baris Data (Row):** Tinggi minimum `36px`. Garis batas bawah (`border-bottom`) dan batas vertikal antar sel menggunakan `1px solid #E9E9E7`.
- **Padding Sel:** `6px 8px`.
- **Interaksi:** Saat baris di-_hover_, muncul tombol kecil untuk membuka detail item ("OPEN") di sisi kanan sel pertama.

### C. Papan Kanban & Galeri (Board & Gallery Cards)

Digunakan untuk manajemen tugas atau menampilkan daftar proyek secara visual.

- **Latar Belakang Kartu:** `#FFFFFF` (Light) / `#252525` (Dark).
- **Border Radius:** `6px`.
- **Bayangan Kartu (Box Shadow):**
  - _Light Mode:_ `rgba(15, 15, 15, 0.08) 0px 0px 0px 1px, rgba(15, 15, 15, 0.06) 0px 2px 4px`
  - _Hover State:_ Ubah warna latar menjadi `#FBFBFA` dengan transisi `background 100ms ease-in`.
- **Padding Internal:** `10px 12px`.

### D. Lencana Status (Tags / Select Pills)

- **Bentuk:** Kotak dengan sudut membulat lembut (`border-radius: 3px` atau `4px`), **bukan** kapsul penuh (`999px`), kecuali untuk tipe properti _Status_ khusus yang menggunakan kapsul penuh dengan titik lingkaran di sebelah kiri.
- **Ukuran:** Tinggi `20px`, `padding: 0 6px`, ukuran teks `12px`, `line-height: 20px`, tidak boleh terpotong ke baris baru (`white-space: nowrap`).

### E. Tombol & Navigasi (Buttons & Controls)

- **Ghost Button (Standar Notion):** Sebagian besar tombol tidak memiliki latar belakang dan garis batas pada kondisi diam.
  - _Default:_ `background: transparent`, `color: #787774`, `padding: 4px 8px`, `border-radius: 4px`, ukuran teks `14px`.
  - _Hover:_ `background: rgba(55, 53, 47, 0.06)`, `color: #37352F`.
  - _Active/Pressed:_ `background: rgba(55, 53, 47, 0.12)`.
- **Item Navigasi Sidebar:**
  - Tinggi baris `28px` atau `30px`, `padding: 0 10px`, `margin: 1px 6px`, `border-radius: 4px`.
  - Ikon di kiri (`18px`), jarak antara ikon dan teks `8px`.
  - Item yang sedang aktif memiliki latar `rgba(55, 53, 47, 0.06)` dan ketebalan teks `600` (SemiBold) dengan warna `#37352F`.

---

## 6. Bayangan, Garis Batas, & Sudut (Elevation & Radius)

Notion menghindari kesan 3D yang berlebihan. Ketinggian elemen (_elevation_) diatur secara ketat:

1. **Border Radius:**
   - Elemen kecil (Tag, Checkbox, Tombol ikon): `3px` - `4px`
   - Elemen sedang (Kartu Kanban, Callout, Input pencarian): `6px`
   - Elemen besar (Modal, Popover menu, Dropdown): `8px`
2. **Box Shadows (Hanya untuk Elemen Melayang / Popover):**
   - **Dropdown / Menu Konteks:**
     `rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px`
   - **Modal / Dialog Tengah Layar:**
     `rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px`

---

## 7. Variabel CSS Siap Pakai (Starter Boilerplate)

Salin dan tempelkan konfigurasi CSS Variables di bawah ini ke dalam file `globals.css` atau `variables.css` proyek dashboard Anda untuk langsung mendapatkan skema gaya Notion:

```css
:root {
  /* Font Families */
  --font-sans:
    "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif;
  --font-mono: "iawriter-mono", Nitti, Menlo, Courier, monospace;
  --font-serif: "Lyon-Text", Georgia, serif;

  /* Light Mode Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #fbfbfa;
  --bg-hover: rgba(55, 53, 47, 0.06);
  --bg-active: rgba(55, 53, 47, 0.12);

  --text-primary: #37352f;
  --text-secondary: #787774;
  --text-muted: #b4b4b0;

  --border-color: rgba(55, 53, 47, 0.09);
  --border-strong: rgba(55, 53, 47, 0.16);

  /* Brand & Primary Action */
  --accent-blue: #2383e2;
  --accent-blue-hover: #1b6ec2;

  /* Tag / Badge Colors (Light) */
  --tag-gray-bg: #e3e2e0;
  --tag-gray-text: #37352f;
  --tag-brown-bg: #eee0da;
  --tag-brown-text: #64473a;
  --tag-orange-bg: #fadec9;
  --tag-orange-text: #d9730d;
  --tag-yellow-bg: #fdecc8;
  --tag-yellow-text: #dfab01;
  --tag-green-bg: #dbeddb;
  --tag-green-text: #0f7b6c;
  --tag-blue-bg: #d3e5ef;
  --tag-blue-text: #0b6e99;
  --tag-purple-bg: #e8deee;
  --tag-purple-text: #6940a5;
  --tag-pink-bg: #f5e0e9;
  --tag-pink-text: #ad1a72;
  --tag-red-bg: #ffe2dd;
  --tag-red-text: #e03e3e;

  /* Shadows & Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-card:
    rgba(15, 15, 15, 0.08) 0px 0px 0px 1px, rgba(15, 15, 15, 0.04) 0px 2px 4px;
  --shadow-popover:
    rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px,
    rgba(15, 15, 15, 0.2) 0px 9px 24px;

  /* Layout Dimensions */
  --sidebar-width: 240px;
  --topbar-height: 45px;
}

[data-theme="dark"] {
  /* Dark Mode Colors */
  --bg-primary: #191919;
  --bg-secondary: #202020;
  --bg-hover: rgba(255, 255, 255, 0.055);
  --bg-active: rgba(255, 255, 255, 0.1);

  --text-primary: rgba(255, 255, 255, 0.81);
  --text-secondary: #9b9a97;
  --text-muted: #5a5a5a;

  --border-color: rgba(255, 255, 255, 0.09);
  --border-strong: rgba(255, 255, 255, 0.16);

  /* Tag / Badge Colors (Dark) */
  --tag-gray-bg: #373737;
  --tag-gray-text: rgba(255, 255, 255, 0.81);
  --tag-brown-bg: #43302b;
  --tag-brown-text: #e2b6a7;
  --tag-orange-bg: #593a22;
  --tag-orange-text: #ffa344;
  --tag-yellow-bg: #594a24;
  --tag-yellow-text: #ffdc49;
  --tag-green-bg: #243d30;
  --tag-green-text: #4dab9a;
  --tag-blue-bg: #243a4e;
  --tag-blue-text: #529cca;
  --tag-purple-bg: #3c2d49;
  --tag-purple-text: #9a6dd7;
  --tag-pink-bg: #4e2c3c;
  --tag-pink-text: #e255a1;
  --tag-red-bg: #592a2a;
  --tag-red-text: #ff7369;

  --shadow-card:
    rgba(15, 15, 15, 0.2) 0px 0px 0px 1px, rgba(15, 15, 15, 0.2) 0px 2px 4px;
}
```
