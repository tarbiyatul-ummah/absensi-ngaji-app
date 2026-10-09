/**
 * Design System Tokens
 * Absensi Ngaji App
 *
 * Source of truth for programmatic access to design tokens.
 * Mapped 1:1 to Tailwind CSS v4 @theme and CSS Variables.
 */

export const tokens = {
  // 1. Color Palette (Semantic)
  colors: {
    background: "var(--background)",
    foreground: "var(--foreground)",
    card: {
      DEFAULT: "var(--card)",
      foreground: "var(--card-foreground)",
    },
    popover: {
      DEFAULT: "var(--popover)",
      foreground: "var(--popover-foreground)",
    },
    primary: {
      DEFAULT: "var(--primary)",
      foreground: "var(--primary-foreground)",
    },
    secondary: {
      DEFAULT: "var(--secondary)",
      foreground: "var(--secondary-foreground)",
    },
    muted: {
      DEFAULT: "var(--muted)",
      foreground: "var(--muted-foreground)",
    },
    accent: {
      DEFAULT: "var(--accent)",
      foreground: "var(--accent-foreground)",
    },
    border: "var(--border)",
    input: "var(--input)",
    ring: "var(--ring)",

    // Semantic Status Tokens
    success: {
      subtle: "var(--success-subtle)",
      text: "var(--success-text)",
      border: "var(--success-border)",
    },
    warning: {
      subtle: "var(--warning-subtle)",
      text: "var(--warning-text)",
      border: "var(--warning-border)",
    },
    danger: {
      subtle: "var(--danger-subtle)",
      text: "var(--danger-text)",
      border: "var(--danger-border)",
    },
  },

  // 2. Corner Radii Scale
  radii: {
    none: "0px",
    xs: "0.25rem",   // 4px
    sm: "0.375rem",  // 6px
    md: "0.5rem",    // 8px
    lg: "0.625rem",  // 10px
    xl: "0.75rem",   // 12px (App Standard for Cards, Popovers, Modals)
    "2xl": "1rem",   // 16px (Dialog Panels, Bottom Sheets)
    full: "9999px",  // Pills, Avatars, Badges
  },

  // 3. Spacing Scale (4px Base Modular Grid)
  spacing: {
    0.5: "0.125rem", // 2px
    1: "0.25rem",    // 4px
    1.5: "0.375rem", // 6px
    2: "0.5rem",     // 8px
    2.5: "0.625rem", // 10px
    3: "0.75rem",    // 12px
    3.5: "0.875rem", // 14px
    4: "1rem",       // 16px
    5: "1.25rem",    // 20px
    6: "1.5rem",     // 24px
    7: "1.75rem",    // 28px
    8: "2rem",       // 32px
    10: "2.5rem",    // 40px
    12: "3rem",      // 48px
    16: "4rem",      // 64px
  },

  // 4. Typography Scale
  typography: {
    fonts: {
      sans: "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "'Geist Variable', 'Inter', sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    sizes: {
      "2xs": { fontSize: "0.625rem", lineHeight: "0.875rem" }, // 10px / 14px
      xs: { fontSize: "0.75rem", lineHeight: "1rem" },          // 12px / 16px
      sm: { fontSize: "0.875rem", lineHeight: "1.25rem" },      // 14px / 20px
      base: { fontSize: "1rem", lineHeight: "1.5rem" },         // 16px / 24px
      lg: { fontSize: "1.125rem", lineHeight: "1.625rem" },     // 18px / 26px
      xl: { fontSize: "1.25rem", lineHeight: "1.75rem" },       // 20px / 28px
      "2xl": { fontSize: "1.5rem", lineHeight: "2rem" },        // 24px / 32px
      "3xl": { fontSize: "1.875rem", lineHeight: "2.375rem" },  // 30px / 38px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // 5. Elevation & Shadows
  shadows: {
    none: "none",
    "2xs": "0 1px 2px 0 rgb(0 0 0 / 0.04)",
    xs: "0 1px 3px 0 rgb(0 0 0 / 0.06)",
    sm: "0 2px 4px -1px rgb(0 0 0 / 0.06)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.08)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.10)",
  },

  // 6. Motion & Spring Transitions
  motion: {
    duration: {
      fast: "150ms",
      normal: "200ms",
      slow: "300ms",
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      snappy: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
    spring: {
      snappy: { type: "spring", stiffness: 500, damping: 30 },
      default: { type: "spring", stiffness: 400, damping: 28 },
    },
  },
} as const;

export type DesignTokens = typeof tokens;

