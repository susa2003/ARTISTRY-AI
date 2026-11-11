/**
 * ARTISTRY AI — Loomis Head Construction Overlay Renderer
 * Renders the 8-stage Andrew Loomis method for head construction:
 * 1. Cranium sphere
 * 2. Brow equator & vertical centerline
 * 3. Elliptical side plane (temporal flat disc)
 * 4. Jawline wedge & chin box
 * 5. Classical facial thirds (Hairline, Brow, Nose Base, Chin)
 * 6. Feature block-in (eye sockets, nose pyramid, mouth line, ear)
 * 7. Structural facial planes
 * 8. Planar tonal light/shadow mapping
 */

import React, { useMemo } from "react";
import { Circle, Group, Line, Oval, Path } from "@shopify/react-native-skia";
import type { LoomisOverlayConfig } from "../../../domain/overlayTypes";
import type { OverlayRenderContext } from "../OverlayContext";
import { calculateLoomisGeometry, type LoomisParams } from "../../loomis/LoomisEngine";
import {
  createCurvedSplinePath,
  createPolygonPath,
} from "../geometry/pathHelpers";

interface LoomisOverlayRendererProps {
  overlay: LoomisOverlayConfig;
  context: OverlayRenderContext;
}

export function LoomisOverlayRenderer({ overlay, context }: LoomisOverlayRendererProps) {
  const { refWidth, refHeight } = context;
  const {
    stage = 1,
    centerX = 0.5,
    centerY = 0.42,
    radius = 0.26,
    yaw = 0,
    pitch = 0,
    roll = 0,
    jawLength = 1.0,
    color = "#CB7857",
    strokeWidth = 2.0,
    showConstructionPlanes = true,
  } = overlay;

  const params: LoomisParams = useMemo(() => ({
    centerX,
    centerY,
    radius,
    yaw,
    pitch,
    roll,
    jawLength,
  }), [centerX, centerY, radius, yaw, pitch, roll, jawLength]);

  const geo = useMemo(() => {
    return calculateLoomisGeometry(params, refWidth, refHeight);
  }, [params, refWidth, refHeight]);

  // Center Axis spline
  const centerPath = useMemo(() => {
    return createCurvedSplinePath(geo.centerAxis);
  }, [geo.centerAxis]);

  // Brow Equator spline
  const browPath = useMemo(() => {
    return createCurvedSplinePath(geo.browAxis);
  }, [geo.browAxis]);

  // Jawline contour
  const jawPath = useMemo(() => {
    return createCurvedSplinePath(geo.jawContour);
  }, [geo.jawContour]);

  // Feature block-in paths
  const nosePyramidPath = useMemo(() => {
    return createPolygonPath(geo.featureBlockIn.nosePyramid, true);
  }, [geo.featureBlockIn.nosePyramid]);

  const leftEyeSocketPath = useMemo(() => {
    return createPolygonPath(geo.featureBlockIn.leftEyeSocket, true);
  }, [geo.featureBlockIn.leftEyeSocket]);

  const rightEyeSocketPath = useMemo(() => {
    return createPolygonPath(geo.featureBlockIn.rightEyeSocket, true);
  }, [geo.featureBlockIn.rightEyeSocket]);

  const earContourPath = useMemo(() => {
    return createCurvedSplinePath(geo.featureBlockIn.earContour);
  }, [geo.featureBlockIn.earContour]);

  // Facial plane facets
  const facialPlanePaths = useMemo(() => {
    return geo.facePlanes.map((p) => ({
      name: p.name,
      path: createPolygonPath(p.polygon, true),
    }));
  }, [geo.facePlanes]);

  // Shadow plane paths
  const shadowPlanePaths = useMemo(() => {
    return geo.shadowPlanes.map((s, idx) => ({
      idx,
      opacity: s.opacity,
      path: createPolygonPath(s.polygon, true),
    }));
  }, [geo.shadowPlanes]);

  return (
    <Group opacity={overlay.opacity}>
      {/* STAGE 1: Cranium Primary Sphere */}
      {stage >= 1 && (
        <Circle
          cx={geo.craniumCircle.cx}
          cy={geo.craniumCircle.cy}
          r={geo.craniumCircle.r}
          style="stroke"
          strokeWidth={strokeWidth}
          color={color}
        />
      )}

      {/* STAGE 2: Centerline & Brow Equator */}
      {stage >= 2 && (
        <>
          <Path
            path={centerPath}
            style="stroke"
            strokeWidth={strokeWidth * 1.15}
            color={color}
          />
          <Path
            path={browPath}
            style="stroke"
            strokeWidth={strokeWidth * 1.15}
            color={color}
          />
        </>
      )}

      {/* STAGE 3: Side Plane Flat Ellipse Disc & Temple Crosshairs */}
      {stage >= 3 && (
        <Group
          origin={{ x: geo.sideDisc.cx, y: geo.sideDisc.cy }}
          transform={[{ rotate: geo.sideDisc.rotation }]}
        >
          <Oval
            x={geo.sideDisc.cx - geo.sideDisc.rx}
            y={geo.sideDisc.cy - geo.sideDisc.ry}
            width={geo.sideDisc.rx * 2}
            height={geo.sideDisc.ry * 2}
            style="stroke"
            strokeWidth={strokeWidth}
            color={color}
          />
          <Line
            p1={{ x: geo.sideDiscCrossAxes.horizontal[0].x, y: geo.sideDiscCrossAxes.horizontal[0].y }}
            p2={{ x: geo.sideDiscCrossAxes.horizontal[1].x, y: geo.sideDiscCrossAxes.horizontal[1].y }}
            style="stroke"
            strokeWidth={strokeWidth * 0.75}
            color={color}
          />
          <Line
            p1={{ x: geo.sideDiscCrossAxes.vertical[0].x, y: geo.sideDiscCrossAxes.vertical[0].y }}
            p2={{ x: geo.sideDiscCrossAxes.vertical[1].x, y: geo.sideDiscCrossAxes.vertical[1].y }}
            style="stroke"
            strokeWidth={strokeWidth * 0.75}
            color={color}
          />
        </Group>
      )}

      {/* STAGE 4: Jawline Contour & Chin Wedge */}
      {stage >= 4 && (
        <Path
          path={jawPath}
          style="stroke"
          strokeWidth={strokeWidth * 1.2}
          color={color}
        />
      )}

      {/* STAGE 5: Classical Facial Thirds Divisions */}
      {stage >= 5 && (
        <Group>
          {geo.facialThirdsLines.map((third, idx) => (
            <Line
              key={`third-${idx}`}
              p1={{ x: third.line[0].x, y: third.line[0].y }}
              p2={{ x: third.line[1].x, y: third.line[1].y }}
              style="stroke"
              strokeWidth={strokeWidth * 0.85}
              color={color}
              opacity={0.8}
            />
          ))}
        </Group>
      )}

      {/* STAGE 6: Feature Block-In (Eye Sockets, Nose Pyramid, Ear) */}
      {stage >= 6 && (
        <>
          <Line
            p1={{ x: geo.featureBlockIn.eyeLine[0].x, y: geo.featureBlockIn.eyeLine[0].y }}
            p2={{ x: geo.featureBlockIn.eyeLine[1].x, y: geo.featureBlockIn.eyeLine[1].y }}
            style="stroke"
            strokeWidth={strokeWidth * 0.8}
            color={color}
          />
          <Path
            path={leftEyeSocketPath}
            style="stroke"
            strokeWidth={strokeWidth * 0.8}
            color={color}
          />
          <Path
            path={rightEyeSocketPath}
            style="stroke"
            strokeWidth={strokeWidth * 0.8}
            color={color}
          />
          <Path
            path={nosePyramidPath}
            style="stroke"
            strokeWidth={strokeWidth}
            color={color}
          />
          <Line
            p1={{ x: geo.featureBlockIn.mouthLine[0].x, y: geo.featureBlockIn.mouthLine[0].y }}
            p2={{ x: geo.featureBlockIn.mouthLine[1].x, y: geo.featureBlockIn.mouthLine[1].y }}
            style="stroke"
            strokeWidth={strokeWidth * 0.8}
            color={color}
          />
          <Path
            path={earContourPath}
            style="stroke"
            strokeWidth={strokeWidth * 0.9}
            color={color}
          />
        </>
      )}

      {/* STAGE 7: Planes of the Face & Facets */}
      {stage >= 7 && showConstructionPlanes && (
        <>
          {facialPlanePaths.map((plane, idx) => (
            <Path
              key={`plane-${idx}`}
              path={plane.path}
              style="stroke"
              strokeWidth={Math.max(0.75, strokeWidth * 0.7)}
              color={color}
              opacity={0.65}
            />
          ))}
        </>
      )}

      {/* STAGE 8: Planar Tonal Mapping & Shadow Planes */}
      {stage >= 8 && (
        <>
          {shadowPlanePaths.map((shadow) => (
            <Path
              key={`shadow-${shadow.idx}`}
              path={shadow.path}
              style="stroke"
              strokeWidth={strokeWidth * 1.2}
              color="#1A201D"
              opacity={shadow.opacity}
            />
          ))}
        </>
      )}
    </Group>
  );
}
