/**
 * ARTISTRY AI — Unified Traditional Drawing Design System & Theme Engine
 * Phase 8A: Design Tokens, Palette Primitives, Typography, Spacing, and Dual Themes
 *
 * Designed specifically for a premium traditional artist companion:
 * - Archival paper, viridian moss, terracotta clay, ochre gold, and lamp black ink.
 * - Deep graphite studio workstation surfaces for undistracted drawing reference.
 * - Consistent 4-point/8-point spacing, modular typography, and accessible touch targets.
 */

// -----------------------------------------------------------------------------
// 1. Primitive Color Palette
// -----------------------------------------------------------------------------
export const palette = {
  // Archival Paper & Warm Canvas
  canvasPaper: "#F7F6F1",
  canvasPure: "#FFFEFA",
  canvasWarmLinen: "#EAE6DB",
  canvasLine: "#E4E3DA",
  canvasLineSubtle: "#EFEFE8",

  // Lamp Black & Charcoal Ink
  inkPrimary: "#17201C",
  inkSecondary: "#3E4942",
  inkMuted: "#71796F",
  inkSubtle: "#9BA299",

  // Studio Slate & Graphite Workstation (Dark Surfaces)
  studioBg: "#121815",
  studioSurface: "#18201C",
  studioElevated: "#202A24",
  studioHighlight: "#28342D",
  studioBorder: "#26322B",
  studioBorderStrong: "#34463C",

  // Studio Dark Typography
  studioTextPrimary: "#F6F5EE",
  studioTextSecondary: "#C5D7CC",
  studioTextMuted: "#8B9A90",
  studioTextSubtle: "#627368",

  // Traditional Pigments (Brand Accents)
  moss: "#28594B",           // Deep Viridian / Forest
  mossVibrant: "#397D69",    // Active Viridian
  mossLight: "#E2E8DC",      // Pale Sage Wash
  mossDark: "#1C3E34",       // Shadow Moss
  mint: "#52C096",           // Luminous Mint

  clay: "#CB7857",           // Burnt Terracotta
  clayLight: "#F4E7DF",      // Warm Terracotta Tint
  clayDark: "#9E563B",       // Deep Oxide

  ochre: "#D5A844",          // Raw Ochre Gold
  ochreLight: "#F8F0DE",     // Pale Gold Wash
  ochreDark: "#A57D27",      // Burnt Umber Ochre

  // Semantic Feedback Pigments
  danger: "#A74335",         // Cadmium Red
  dangerLight: "#FBECEB",
  dangerDark: "#7D2D22",

  warning: "#D9822B",        // Burnt Orange Amber
  warningLight: "#FEF3E8",

  info: "#427A9C",           // Prussian Blue
  infoLight: "#EBF3F8",

  // Neutral Extremes
  white: "#FFFFFF",
  black: "#000000",
} as const;

// -----------------------------------------------------------------------------
// 2. Backward-Compatible Colors Object (Strict Preservation)
// -----------------------------------------------------------------------------
export const colors = {
  // Canonical Legacy Aliases
  canvas: palette.canvasPaper,
  paper: palette.canvasPure,
  ink: palette.inkPrimary,
  charcoal: palette.inkPrimary,
  muted: palette.inkMuted,
  inkMuted: palette.inkMuted,
  line: palette.canvasLine,
  moss: palette.moss,
  forest: palette.moss,
  mossLight: palette.mossLight,
  clay: palette.clay,
  terracotta: palette.clay,
  dark: "#25332D",
  white: palette.white,
  danger: palette.danger,
  sage: palette.moss,
  copper: palette.clay,

  // Modern Semantic Extensions
  studioBg: palette.studioBg,
  studioSurface: palette.studioSurface,
  studioElevated: palette.studioElevated,
  studioBorder: palette.studioBorder,
  studioBorderStrong: palette.studioBorderStrong,
  textPrimary: palette.inkPrimary,
  textSecondary: palette.inkSecondary,
  textMuted: palette.inkMuted,
  textLight: palette.studioTextPrimary,
  gold: palette.ochre,
  goldLight: palette.ochreLight,
  mint: palette.mint,
  warning: palette.warning,
} as const;

// -----------------------------------------------------------------------------
// 3. Spacing Scale (4-Point & 8-Point Grid)
// -----------------------------------------------------------------------------
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

// -----------------------------------------------------------------------------
// 4. Border Radius Scale
// -----------------------------------------------------------------------------
export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
  round: 9999,
} as const;

// -----------------------------------------------------------------------------
// 5. Typography Scale
// -----------------------------------------------------------------------------
export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  title1: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  title2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },
  title3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const,
    letterSpacing: -0.1,
  },
  headline: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700" as const,
    letterSpacing: 0,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    letterSpacing: 0,
  },
  bodyBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700" as const,
    letterSpacing: 0,
  },
  callout: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500" as const,
    letterSpacing: 0,
  },
  calloutBold: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700" as const,
    letterSpacing: 0,
  },
  subhead: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
  subheadBold: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.1,
  },
  footnote: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500" as const,
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.4,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800" as const,
    letterSpacing: 1.5,
  },
  micro: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
} as const;

// -----------------------------------------------------------------------------
// 6. Icon Sizing Tokens
// -----------------------------------------------------------------------------
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  hero: 44,
} as const;

// -----------------------------------------------------------------------------
// 7. Touch Target Standards (WCAG 44×44pt Minimum Rule)
// -----------------------------------------------------------------------------
export const touchTargets = {
  min: 44,
  compact: 36,
  comfortable: 48,
} as const;

// -----------------------------------------------------------------------------
// 8. Elevation & Shadow Profiles
// -----------------------------------------------------------------------------
export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: "#17201C",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: "#17201C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  floating: {
    shadowColor: "#0D1410",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// -----------------------------------------------------------------------------
// 9. Structured Themes: Studio Dark & Archival Paper Light
// -----------------------------------------------------------------------------
export const themes = {
  light: {
    id: "light",
    name: "Archival Paper",
    isDark: false,
    background: palette.canvasPaper,
    surface: palette.canvasPure,
    surfaceSubtle: palette.canvasWarmLinen,
    surfaceElevated: palette.canvasPure,
    border: palette.canvasLine,
    borderStrong: "#D5D4CA",
    borderSubtle: palette.canvasLineSubtle,
    textPrimary: palette.inkPrimary,
    textSecondary: palette.inkSecondary,
    textMuted: palette.inkMuted,
    textInverse: palette.studioTextPrimary,
    accent: palette.moss,
    accentSoft: palette.mossLight,
    accentVibrant: palette.mossVibrant,
    secondaryAccent: palette.clay,
    tertiaryAccent: palette.ochre,
    danger: palette.danger,
    warning: palette.warning,
    overlayScrim: "rgba(18, 24, 21, 0.45)",
    canvasBackground: palette.canvasPaper,
  },
  dark: {
    id: "dark",
    name: "Studio Graphite",
    isDark: true,
    background: palette.studioBg,
    surface: palette.studioSurface,
    surfaceSubtle: "#1C2520",
    surfaceElevated: palette.studioElevated,
    border: palette.studioBorder,
    borderStrong: palette.studioBorderStrong,
    borderSubtle: "#1E2721",
    textPrimary: palette.studioTextPrimary,
    textSecondary: palette.studioTextSecondary,
    textMuted: palette.studioTextMuted,
    textInverse: palette.inkPrimary,
    accent: palette.moss,
    accentSoft: "#223930",
    accentVibrant: palette.mint,
    secondaryAccent: palette.clay,
    tertiaryAccent: palette.ochre,
    danger: palette.danger,
    warning: palette.warning,
    overlayScrim: "rgba(0, 0, 0, 0.70)",
    canvasBackground: "#0E1411",
  },
} as const;

// -----------------------------------------------------------------------------
// 10. Responsive Breakpoint Tokens & Calculator
// -----------------------------------------------------------------------------
export const breakpoints = {
  smallPhone: 360,    // Compact phones (<360dp, e.g. 320dp)
  standardPhone: 393, // Standard modern phones (360–393dp)
  largePhone: 480,    // Large phones & phablets (393–480dp)
  tabletSmall: 600,   // Small tablets (600dp+)
  tabletLarge: 900,   // Large tablets & wide foldables (900dp+)
} as const;

export interface ResponsiveDimensions {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isSmallPhone: boolean;
  isStandardPhone: boolean;
  isLargePhone: boolean;
  isTablet: boolean;
  columns: number;
  contentMaxWidth: number | string;
  gutter: number;
  horizontalPadding: number;
}

/**
 * Pure calculation function for responsive layout states.
 * Can be tested directly across 320dp, 360dp, 393dp, 412dp, 600dp, 900dp.
 */
export function calculateResponsiveLayout(width: number, height: number): ResponsiveDimensions {
  const isPortrait = height >= width;
  const isSmallPhone = width < breakpoints.smallPhone;
  const isStandardPhone = width >= breakpoints.smallPhone && width < breakpoints.largePhone;
  const isLargePhone = width >= breakpoints.largePhone && width < breakpoints.tabletSmall;
  const isTablet = width >= breakpoints.tabletSmall;

  // Adaptive column calculation: 1 col on <340dp, 2 on phones, 3 on tablets, 4 on large tablets
  const columns = width >= breakpoints.tabletLarge ? 4 : width >= breakpoints.tabletSmall ? 3 : width < 340 ? 1 : 2;
  const contentMaxWidth = width >= breakpoints.tabletLarge ? 1120 : width >= breakpoints.tabletSmall ? 840 : "100%";
  const gutter = isSmallPhone ? 12 : isTablet ? 24 : 16;
  const horizontalPadding = gutter;

  return {
    width,
    height,
    isPortrait,
    isLandscape: !isPortrait,
    isSmallPhone,
    isStandardPhone,
    isLargePhone,
    isTablet,
    columns,
    contentMaxWidth,
    gutter,
    horizontalPadding,
  };
}

export type Theme = typeof themes.light | typeof themes.dark;
export type ColorPalette = typeof palette;
export type SpacingScale = typeof spacing;
export type RadiiScale = typeof radii;
