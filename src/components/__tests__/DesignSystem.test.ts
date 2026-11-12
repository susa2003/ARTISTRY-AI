/**
 * ARTISTRY AI — Design System & Theme Engine Unit Tests
 * Verifies design tokens, modular scales, theme contracts, and backward compatibility.
 */

import {
  breakpoints,
  calculateResponsiveLayout,
  colors,
  iconSizes,
  palette,
  radii,
  shadows,
  spacing,
  themes,
  touchTargets,
  typography,
} from "../../theme";

describe("Design System Foundation (Phase 8A)", () => {
  describe("1. Primitive Palette & Colors Backward Compatibility", () => {
    it("preserves all canonical legacy colors keys", () => {
      expect(colors.canvas).toBeDefined();
      expect(colors.paper).toBeDefined();
      expect(colors.ink).toBeDefined();
      expect(colors.charcoal).toBeDefined();
      expect(colors.muted).toBeDefined();
      expect(colors.line).toBeDefined();
      expect(colors.moss).toBeDefined();
      expect(colors.forest).toBeDefined();
      expect(colors.mossLight).toBeDefined();
      expect(colors.clay).toBeDefined();
      expect(colors.terracotta).toBeDefined();
      expect(colors.dark).toBeDefined();
      expect(colors.white).toBe("#FFFFFF");
      expect(colors.danger).toBeDefined();
      expect(colors.sage).toBeDefined();
      expect(colors.copper).toBeDefined();
    });

    it("provides modern semantic studio and typography extensions", () => {
      expect(colors.studioBg).toBe(palette.studioBg);
      expect(colors.studioSurface).toBe(palette.studioSurface);
      expect(colors.studioElevated).toBe(palette.studioElevated);
      expect(colors.studioBorder).toBe(palette.studioBorder);
      expect(colors.textPrimary).toBe(palette.inkPrimary);
      expect(colors.textLight).toBe(palette.studioTextPrimary);
      expect(colors.gold).toBe(palette.ochre);
      expect(colors.mint).toBe(palette.mint);
    });

    it("defines traditional drawing pigments with appropriate hex format", () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      expect(palette.canvasPaper).toMatch(hexPattern);
      expect(palette.inkPrimary).toMatch(hexPattern);
      expect(palette.studioBg).toMatch(hexPattern);
      expect(palette.moss).toMatch(hexPattern);
      expect(palette.clay).toMatch(hexPattern);
      expect(palette.ochre).toMatch(hexPattern);
    });
  });

  describe("2. Spacing Scale", () => {
    it("follows a strictly monotonic 4-point/8-point modular scale", () => {
      expect(spacing.xxs).toBe(2);
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(12);
      expect(spacing.base).toBe(16);
      expect(spacing.lg).toBe(20);
      expect(spacing.xl).toBe(24);
      expect(spacing.xxl).toBe(32);
      expect(spacing.xxxl).toBe(40);
      expect(spacing.huge).toBe(48);

      const keys: Array<keyof typeof spacing> = [
        "xxs", "xs", "sm", "md", "base", "lg", "xl", "xxl", "xxxl", "huge"
      ];
      for (let i = 0; i < keys.length - 1; i++) {
        expect(spacing[keys[i]!]).toBeLessThan(spacing[keys[i + 1]!]);
      }
    });
  });

  describe("3. Border Radius Scale", () => {
    it("defines progressive corner radii from subtle to full pill", () => {
      expect(radii.xs).toBe(4);
      expect(radii.sm).toBe(8);
      expect(radii.md).toBe(12);
      expect(radii.lg).toBe(16);
      expect(radii.xl).toBe(20);
      expect(radii.xxl).toBe(24);
      expect(radii.pill).toBe(9999);
      expect(radii.round).toBe(9999);
    });
  });

  describe("4. Typography Scale", () => {
    it("specifies valid numeric font sizes and proportional line heights", () => {
      const textStyles = Object.values(typography);
      textStyles.forEach((style) => {
        expect(typeof style.fontSize).toBe("number");
        expect(style.fontSize).toBeGreaterThan(0);
        expect(typeof style.lineHeight).toBe("number");
        expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize);
      });
    });

    it("verifies hierarchical typography levels", () => {
      expect(typography.display.fontSize).toBe(32);
      expect(typography.title1.fontSize).toBe(24);
      expect(typography.title2.fontSize).toBe(20);
      expect(typography.title3.fontSize).toBe(18);
      expect(typography.headline.fontSize).toBe(16);
      expect(typography.body.fontSize).toBe(14);
      expect(typography.subhead.fontSize).toBe(12);
      expect(typography.caption.fontSize).toBe(10);
      expect(typography.micro.fontSize).toBe(9);
    });
  });

  describe("5. Touch Target Standards", () => {
    it("enforces WCAG mobile touch target minimum of 44pt", () => {
      expect(touchTargets.min).toBe(44);
      expect(touchTargets.comfortable).toBeGreaterThanOrEqual(44);
    });
  });

  describe("6. Dual Theme Support (Archival Paper vs Studio Slate)", () => {
    it("provides complete light and dark theme contracts", () => {
      const { light, dark } = themes;

      expect(light.isDark).toBe(false);
      expect(dark.isDark).toBe(true);

      // Light Theme verifies archival paper values
      expect(light.background).toBe(palette.canvasPaper);
      expect(light.surface).toBe(palette.canvasPure);
      expect(light.textPrimary).toBe(palette.inkPrimary);
      expect(light.border).toBe(palette.canvasLine);

      // Dark Theme verifies studio slate workstation values
      expect(dark.background).toBe(palette.studioBg);
      expect(dark.surface).toBe(palette.studioSurface);
      expect(dark.textPrimary).toBe(palette.studioTextPrimary);
      expect(dark.border).toBe(palette.studioBorder);

      // Consistent accent and semantic pigment links
      expect(light.accent).toBe(palette.moss);
      expect(dark.accent).toBe(palette.moss);
      expect(light.danger).toBe(palette.danger);
      expect(dark.danger).toBe(palette.danger);
    });
  });

  describe("7. Shadow Elevation Profiles", () => {
    it("defines subtle, medium, and floating elevations with positive radii", () => {
      expect(shadows.none.elevation).toBe(0);
      expect(shadows.subtle.elevation).toBe(1);
      expect(shadows.medium.elevation).toBe(3);
      expect(shadows.floating.elevation).toBe(6);
    });
  });

  describe("8. Icon Size Tokens", () => {
    it("defines standard icon sizes from 12px to 44px", () => {
      expect(iconSizes.xs).toBe(12);
      expect(iconSizes.sm).toBe(16);
      expect(iconSizes.md).toBe(20);
      expect(iconSizes.lg).toBe(24);
      expect(iconSizes.xl).toBe(32);
      expect(iconSizes.hero).toBe(44);
    });
  });

  describe("9. Responsive Layout Across Device Configurations", () => {
    it("handles 320dp small phone width correctly", () => {
      const layout = calculateResponsiveLayout(320, 568);
      expect(layout.isSmallPhone).toBe(true);
      expect(layout.isStandardPhone).toBe(false);
      expect(layout.isTablet).toBe(false);
      expect(layout.isPortrait).toBe(true);
      expect(layout.columns).toBe(1); // 1 column for compact screens < 340dp
      expect(layout.contentMaxWidth).toBe("100%");
      expect(layout.gutter).toBe(12);
      expect(layout.horizontalPadding).toBe(12);
    });

    it("handles 360dp standard compact phone width correctly", () => {
      const layout = calculateResponsiveLayout(360, 640);
      expect(layout.isSmallPhone).toBe(false);
      expect(layout.isStandardPhone).toBe(true);
      expect(layout.isTablet).toBe(false);
      expect(layout.isPortrait).toBe(true);
      expect(layout.columns).toBe(2);
      expect(layout.contentMaxWidth).toBe("100%");
      expect(layout.gutter).toBe(16);
      expect(layout.horizontalPadding).toBe(16);
    });

    it("handles 393dp standard modern phone width correctly", () => {
      const layout = calculateResponsiveLayout(393, 852);
      expect(layout.isSmallPhone).toBe(false);
      expect(layout.isStandardPhone).toBe(true);
      expect(layout.isTablet).toBe(false);
      expect(layout.isPortrait).toBe(true);
      expect(layout.columns).toBe(2);
      expect(layout.contentMaxWidth).toBe("100%");
    });

    it("handles 412dp large phone width correctly", () => {
      const layout = calculateResponsiveLayout(412, 915);
      expect(layout.isSmallPhone).toBe(false);
      expect(layout.isStandardPhone).toBe(true);
      expect(layout.isTablet).toBe(false);
      expect(layout.isPortrait).toBe(true);
      expect(layout.columns).toBe(2);
      expect(layout.contentMaxWidth).toBe("100%");
    });

    it("handles 600dp small tablet width correctly", () => {
      const layout = calculateResponsiveLayout(600, 960);
      expect(layout.isSmallPhone).toBe(false);
      expect(layout.isStandardPhone).toBe(false);
      expect(layout.isTablet).toBe(true);
      expect(layout.isPortrait).toBe(true);
      expect(layout.columns).toBe(3); // 3 columns for tablets >= 600dp
      expect(layout.contentMaxWidth).toBe(840);
      expect(layout.gutter).toBe(24);
      expect(layout.horizontalPadding).toBe(24);
    });

    it("handles 900dp+ large tablet / desktop width correctly", () => {
      const layout = calculateResponsiveLayout(1024, 768);
      expect(layout.isTablet).toBe(true);
      expect(layout.isPortrait).toBe(false);
      expect(layout.isLandscape).toBe(true);
      expect(layout.columns).toBe(4); // 4 columns for wide screens >= 900dp
      expect(layout.contentMaxWidth).toBe(1120);
      expect(layout.gutter).toBe(24);
      expect(layout.horizontalPadding).toBe(24);
    });

    it("correctly identifies portrait vs landscape aspect ratios", () => {
      const portrait = calculateResponsiveLayout(393, 852);
      expect(portrait.isPortrait).toBe(true);
      expect(portrait.isLandscape).toBe(false);

      const landscape = calculateResponsiveLayout(852, 393);
      expect(landscape.isPortrait).toBe(false);
      expect(landscape.isLandscape).toBe(true);
    });
  });
});
