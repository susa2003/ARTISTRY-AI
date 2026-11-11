/**
 * ARTISTRY AI — Unified Multi-Overlay Master Renderer
 * Coordinates and renders all active traditional drawing method overlays
 * simultaneously on the same reference image within Reference Studio.
 *
 * Guarantees:
 * - Proper zIndex layering (ascending order)
 * - Per-layer visibility and opacity control
 * - Zero coordinate drift (locked directly to reference canvas transform)
 */

import React, { useMemo } from "react";
import { Group } from "@shopify/react-native-skia";
import type { UnifiedOverlay } from "../../domain/overlayTypes";
import type { OverlayRenderContext } from "./OverlayContext";
import { OVERLAY_REGISTRY } from "./OverlayRegistry";

export interface OverlayRendererProps {
  overlays: UnifiedOverlay[];
  context: OverlayRenderContext;
}

export function OverlayRenderer({ overlays, context }: OverlayRendererProps) {
  // Filter visible layers and sort by zIndex ascending
  const sortedOverlays = useMemo(() => {
    if (!overlays || overlays.length === 0) return [];

    return overlays
      .filter((layer) => layer && layer.visible !== false && (layer.opacity ?? 1.0) > 0)
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  }, [overlays]);

  if (sortedOverlays.length === 0) {
    return null;
  }

  return (
    <Group>
      {sortedOverlays.map((layer) => {
        const descriptor = OVERLAY_REGISTRY[layer.type];
        if (!descriptor) {
          // Unknown or custom overlay type, graceful skip
          return null;
        }

        const RendererComponent = descriptor.renderer;

        return (
          <Group key={layer.id}>
            <RendererComponent overlay={layer} context={context} />
          </Group>
        );
      })}
    </Group>
  );
}
