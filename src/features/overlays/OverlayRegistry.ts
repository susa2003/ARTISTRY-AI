/**
 * ARTISTRY AI — Unified Overlay Registry
 * Central registry mapping each OverlayType to its respective Skia renderer component,
 * metadata, and default configuration generator.
 */

import React from "react";
import type { OverlayType, UnifiedOverlay } from "../../domain/overlayTypes";
import type { OverlayRenderContext } from "./OverlayContext";
import { GridOverlayRenderer } from "./renderers/GridOverlayRenderer";
import { LoomisOverlayRenderer } from "./renderers/LoomisOverlayRenderer";
import { ReillyOverlayRenderer } from "./renderers/ReillyOverlayRenderer";
import { BargueOverlayRenderer } from "./renderers/BargueOverlayRenderer";
import { PerspectiveOverlayRenderer } from "./renderers/PerspectiveOverlayRenderer";
import { AnatomyOverlayRenderer } from "./renderers/AnatomyOverlayRenderer";
import { MeasurementOverlayRenderer } from "./renderers/MeasurementOverlayRenderer";
import { TracingOverlayRenderer } from "./renderers/TracingOverlayRenderer";
import { ShadingOverlayRenderer } from "./renderers/ShadingOverlayRenderer";

export interface OverlayComponentProps<T extends UnifiedOverlay = UnifiedOverlay> {
  overlay: T;
  context: OverlayRenderContext;
}

export type OverlayRendererComponent = React.ComponentType<OverlayComponentProps<any>>;

export interface OverlayDescriptor {
  type: OverlayType;
  title: string;
  icon: string;
  description: string;
  renderer: OverlayRendererComponent;
  createDefault: (id: string, zIndex?: number) => UnifiedOverlay;
}

export const OVERLAY_REGISTRY: Record<OverlayType, OverlayDescriptor> = {
  grid: {
    type: "grid",
    title: "Proportional Grid",
    icon: "⌗",
    description: "Square, rectangular, thirds, golden ratio & metric spacing",
    renderer: GridOverlayRenderer,
    createDefault: (id, zIndex = 1) => ({
      id,
      type: "grid",
      name: "Proportional Grid",
      visible: true,
      opacity: 0.75,
      locked: false,
      zIndex,
      mode: "standard",
      cellMode: "square",
      divisions: 4,
      color: "#28594B",
      strokeWidth: 1.5,
      showLabels: true,
      showDiagonals: false,
      showSubdivisions: false,
    }),
  },
  loomis: {
    type: "loomis",
    title: "Loomis 3D Head",
    icon: "⨁",
    description: "8-stage Andrew Loomis cranial sphere & facial thirds",
    renderer: LoomisOverlayRenderer,
    createDefault: (id, zIndex = 1) => ({
      id,
      type: "loomis",
      name: "Loomis 3D Head",
      visible: true,
      opacity: 0.85,
      locked: false,
      zIndex,
      stage: 1,
      centerX: 0.5,
      centerY: 0.42,
      radius: 0.26,
      yaw: 0,
      pitch: 0,
      roll: 0,
      jawLength: 1.0,
      color: "#CB7857",
      strokeWidth: 2.0,
      showConstructionPlanes: true,
    }),
  },
  reilly: {
    type: "reilly",
    title: "Reilly Rhythms",
    icon: "〰",
    description: "Frank Reilly structural curves, keystone & cheek arcs",
    renderer: ReillyOverlayRenderer,
    createDefault: (id, zIndex = 1) => ({
      id,
      type: "reilly",
      name: "Reilly Rhythm Curves",
      visible: true,
      opacity: 0.8,
      locked: false,
      zIndex,
      centerX: 0.5,
      centerY: 0.45,
      scale: 1.0,
      rotation: 0,
      showBrowCurve: true,
      showCheekArcs: true,
      showNasalKeystone: true,
      showChinLoop: true,
      showNeckRibbons: true,
      color: "#8B4F69",
      strokeWidth: 1.75,
    }),
  },
  bargue: {
    type: "bargue",
    title: "Bargue Block-In",
    icon: "⬡",
    description: "Charles Bargue straight-line envelope & sight-size divisions",
    renderer: BargueOverlayRenderer,
    createDefault: (id, zIndex = 1) => ({
      id,
      type: "bargue",
      name: "Bargue Block-In",
      visible: true,
      opacity: 0.85,
      locked: false,
      zIndex,
      blockInPoints: [],
      showEnvelope: true,
      showPlumbAnchors: true,
      sightSizeDivision: 3,
      color: "#A85D3B",
      strokeWidth: 1.75,
    }),
  },
  perspective: {
    type: "perspective",
    title: "Perspective Assistant",
    icon: "◬",
    description: "1, 2, and 3-point vanishing points, horizon & orthogonals",
    renderer: PerspectiveOverlayRenderer,
    createDefault: (id, zIndex = 1) => ({
      id,
      type: "perspective",
      name: "Perspective Grid",
      visible: true,
      opacity: 0.7,
      locked: false,
      zIndex,
      mode: "2-point",
      horizonY: 0.45,
      vp1X: 0.1,
      vp2X: 0.9,
      vp3Y: -0.3,
      rayCount: 10,
      showVerticals: true,
      color: "#596A94",
      strokeWidth: 1.5,
    }),
  },
  anatomy: {
    type: "anatomy",
    title: "Anatomy Academy",
    icon: "♟",
    description: "Canonical 8-head proportions, armature & muscle groups",
    renderer: AnatomyOverlayRenderer,
    createDefault: (id, zIndex = 1) => ({
      id,
      type: "anatomy",
      name: "8-Head Proportions",
      visible: true,
      opacity: 0.8,
      locked: false,
      zIndex,
      mode: "proportions",
      gender: "neutral",
      heightRatio: 0.82,
      centerX: 0.5,
      centerY: 0.08,
      showMuscles: true,
      color: "#28594B",
      strokeWidth: 1.5,
    }),
  },
  shading: {
    type: "shading",
    title: "5-Value Shading",
    icon: "◑",
    description: "Tonal guide, 3D light dial, terminator & graphite grades",
    renderer: ShadingOverlayRenderer,
    createDefault: (id, zIndex = 1) => ({
      id,
      type: "shading",
      name: "5-Value Tonal Scale",
      visible: true,
      opacity: 0.75,
      locked: false,
      zIndex,
      lightAngle: 45,
      lightElevation: 45,
      valueSteps: 5,
      showTerminator: true,
      showLightRay: true,
      contrast: 1.15,
      showGraphiteGuide: true,
    }),
  },
  plumb: {
    type: "plumb",
    title: "Plumb Lines",
    icon: "┼",
    description: "True vertical and horizontal alignment guides",
    renderer: MeasurementOverlayRenderer,
    createDefault: (id, zIndex = 1) => ({
      id,
      type: "plumb",
      name: "Plumb Alignment",
      visible: true,
      opacity: 0.75,
      locked: false,
      zIndex,
      verticalLines: [0.5],
      horizontalLines: [0.5],
      color: "#D5A844",
      strokeWidth: 1.5,
    }),
  },
  measurement: {
    type: "measurement",
    title: "Sight-Size Calipers",
    icon: "↔",
    description: "Proportional measurement dividers & ratio calipers",
    renderer: MeasurementOverlayRenderer,
    createDefault: (id, zIndex = 1) => ({
      id,
      type: "measurement",
      name: "Sight-Size Calipers",
      visible: true,
      opacity: 0.8,
      locked: false,
      zIndex,
      calipers: [
        {
          id: `${id}-c1`,
          label: "Unit 1",
          p1: { x: 0.4, y: 0.3 },
          p2: { x: 0.6, y: 0.3 },
        },
      ],
      color: "#3A86FF",
    }),
  },
  tracing: {
    type: "tracing",
    title: "Lightbox & Tracing",
    icon: "◻",
    description: "Transfer registration marks, lightbox framing & contours",
    renderer: TracingOverlayRenderer,
    createDefault: (id, zIndex = 1) => ({
      id,
      type: "tracing",
      name: "Lightbox Transfer",
      visible: true,
      opacity: 0.65,
      locked: false,
      zIndex,
      mode: "contrast",
      threshold: 128,
      edgeBoost: true,
      invert: false,
    }),
  },
};
