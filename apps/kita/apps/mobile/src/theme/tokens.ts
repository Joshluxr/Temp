/**
 * Kita brand tokens for the native surface (04-ux-design.md D1).
 * Exact hex values are required — the web CSS approximates them through HSL
 * and must not be copied here. Same palette on every surface; no navy/teal
 * variants.
 */

export const colors = {
  ink: "#0a0a0a",
  warm: "#f5f5f0",
  lime: "#c8ff00",
  paper: "#ffffff",
  textPrimary: "#0a0a0a",
  textSecondary: "#52524b",
  boundary: "#707068",
  error: "#b42318",
  pending: "#855300",
  delivered: "#226045",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const radii = { input: 12, surface: 16 } as const;

/** D1: 44-48px primary targets, 56px mobile CTA. Reads-only screens have no CTA. */
export const control = { height: 48, ctaHeight: 56, bodyFontSize: 16, moneyFontSize: 34 } as const;

/**
 * Status pairs always carry icon + text (D1); color alone is never the signal.
 * `unknown` deliberately maps to pending amber with "checking" copy (D4) — an
 * unknown provider result is never rendered as failed or as delivered.
 */
export const statusTone = {
  delivered: { color: colors.delivered, glyph: "^" },
  pending: { color: colors.pending, glyph: "~" },
  unknown: { color: colors.pending, glyph: "?" },
  error: { color: colors.error, glyph: "!" },
  neutral: { color: colors.textSecondary, glyph: "-" },
} as const;

export type StatusToneKey = keyof typeof statusTone;
