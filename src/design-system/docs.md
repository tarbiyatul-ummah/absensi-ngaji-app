# Design System Documentation

**Absensi Ngaji App**  
*Atomic Architecture & Tailwind CSS v4 Token Engine*

---

## 1. Design Token Hierarchy

### 1.1 Semantic Status Colors
Gunakan token semantik ini daripada kode HSL atau arbitrary hex:

| Token Tailwind Utility | Light Mode | Dark Mode | Penggunaan |
| :--- | :--- | :--- | :--- |
| `bg-success-subtle`, `text-success`, `border-success-border` | Mint pastel | Dark Emerald | Status Lunas, Hadir, Aktif |
| `bg-warning-subtle`, `text-warning`, `border-warning-border` | Warm amber | Dark Ochre | Status Izin, Pending |
| `bg-danger-subtle`, `text-danger`, `border-danger-border` | Soft Rose | Dark Crimson | Status Belum Bayar, Alfa, Delete |
| `bg-muted`, `text-muted-foreground`, `border-border` | Neutral Gray | Dark Charcoal | Belum Terdaftar, Neutral status |

### 1.2 Corner Radii Scale
- `rounded-xs` (4px): Badges mikro, status dot.
- `rounded-sm` (6px): Tooltips, kbd tag.
- `rounded-md` (8px): Action buttons kecil.
- `rounded-lg` (10px): Dropdown items, inner control elements.
- **`rounded-xl` (12px) - APP DEFAULT**: Cards, Popover Floating Cards, Buttons, Inputs.
- `rounded-2xl` (16px): Modal dialog containers, bottom sheets.
- `rounded-full` (9999px): Status Badges/Pills, Avatars.

### 1.3 Elevation / Shadows
- `shadow-2xs`: Inputs, small default buttons.
- `shadow-xs`: StatCards, compact cards.
- `shadow-sm`: Interactive cards hover state.
- **`shadow-xl`**: Floating dropdown popover cards (User Account Menu, Select dropdowns, Actions menus).
- `shadow-2xl`: Large modal dialogs.

---

## 2. Atomic Components Reference

### 2.1 Atoms
- `Button` (`src/components/ui/button.tsx`):
  - Variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `success`.
  - Radius: `rounded-xl`.
- `Badge` (`src/components/ui/badge.tsx`):
  - Variants: `default`, `secondary`, `outline`, `success`, `warning`, `danger`, `neutral`.
  - Format: `rounded-full text-[10px] font-medium border px-2.5 py-0.5`.
- `Input` & `Textarea` (`src/components/ui/input.tsx`, `textarea.tsx`):
  - Radius: `rounded-xl border border-input shadow-2xs`.
- `Card` (`src/components/ui/card.tsx`):
  - Standard container: `rounded-xl border border-border bg-card shadow-xs`.

### 2.2 Molecules
- `Select` (`src/components/ui/select.tsx`):
  - Trigger: `rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium`.
  - Popover Content: Floating card `rounded-xl border border-border bg-card p-1.5 shadow-xl min-w-[8.5rem]`.
  - Item: `rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-accent/70`.
- `SearchInput` (`src/components/ui/search-input.tsx`):
  - Standard search field with magnifying glass icon, clear button, and accessible keyboard support.
- `FilterChip` (`src/components/ui/filter-chip.tsx`):
  - Pill interactive filter with smooth motion layout animation.
- `StatisticCard` (`src/components/dashboard/StatisticCard.tsx`):
  - Summary KPI metric card with token typography and icon container.

### 2.3 Templates
- `PageHeader` (`src/components/layout/PageHeader.tsx`):
  - Standard page header with title, subtitle, optional `backTo` navigation, and responsive actions slot.

