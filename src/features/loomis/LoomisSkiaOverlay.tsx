import { useMemo } from "react";
import { Group, Line, Oval, Path, Skia } from "@shopify/react-native-skia";
import { calculateLoomisGeometry, type LoomisParams } from "./LoomisEngine";

type Props = {
  params: LoomisParams;
  stage: number; // 1 to 8
  width: number;
  height: number;
  opacity?: number;
};

export function LoomisSkiaOverlay({ params, stage, width, height, opacity = 1.0 }: Props) {
  const geo = useMemo(() => calculateLoomisGeometry(params, width, height), [params, width, height]);

  // Center axis path
  const centerPath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    if (geo.centerAxis.length > 0) {
      builder.moveTo(geo.centerAxis[0]!.x, geo.centerAxis[0]!.y);
      for (let i = 1; i < geo.centerAxis.length; i++) {
        builder.lineTo(geo.centerAxis[i]!.x, geo.centerAxis[i]!.y);
      }
    }
    return builder.build();
  }, [geo.centerAxis]);

  // Brow axis path
  const browPath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    if (geo.browAxis.length > 0) {
      builder.moveTo(geo.browAxis[0]!.x, geo.browAxis[0]!.y);
      for (let i = 1; i < geo.browAxis.length; i++) {
        builder.lineTo(geo.browAxis[i]!.x, geo.browAxis[i]!.y);
      }
    }
    return builder.build();
  }, [geo.browAxis]);

  // Jawline path
  const jawPath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    if (geo.jawContour.length > 0) {
      builder.moveTo(geo.jawContour[0]!.x, geo.jawContour[0]!.y);
      for (let i = 1; i < geo.jawContour.length; i++) {
        builder.lineTo(geo.jawContour[i]!.x, geo.jawContour[i]!.y);
      }
    }
    return builder.build();
  }, [geo.jawContour]);

  // Nose pyramid path
  const nosePath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    if (geo.featureBlockIn.nosePyramid.length > 0) {
      builder.moveTo(geo.featureBlockIn.nosePyramid[0]!.x, geo.featureBlockIn.nosePyramid[0]!.y);
      for (let i = 1; i < geo.featureBlockIn.nosePyramid.length; i++) {
        builder.lineTo(geo.featureBlockIn.nosePyramid[i]!.x, geo.featureBlockIn.nosePyramid[i]!.y);
      }
      builder.close();
    }
    return builder.build();
  }, [geo.featureBlockIn.nosePyramid]);

  // Eye sockets
  const leftSocketPath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    const pts = geo.featureBlockIn.leftEyeSocket;
    if (pts.length > 0) {
      builder.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) builder.lineTo(pts[i]!.x, pts[i]!.y);
      builder.close();
    }
    return builder.build();
  }, [geo.featureBlockIn.leftEyeSocket]);

  const rightSocketPath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    const pts = geo.featureBlockIn.rightEyeSocket;
    if (pts.length > 0) {
      builder.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) builder.lineTo(pts[i]!.x, pts[i]!.y);
      builder.close();
    }
    return builder.build();
  }, [geo.featureBlockIn.rightEyeSocket]);

  // Ear contour
  const earPath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    const pts = geo.featureBlockIn.earContour;
    if (pts.length > 0) {
      builder.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) builder.lineTo(pts[i]!.x, pts[i]!.y);
    }
    return builder.build();
  }, [geo.featureBlockIn.earContour]);

  const strokeScale = Math.max(1, width / 700);

  return (
    <Group opacity={opacity}>
      {/* STAGE 1: Cranium Circle */}
      {stage >= 1 && (
        <Group>
          <Oval
            x={geo.craniumCircle.cx - geo.craniumCircle.r}
            y={geo.craniumCircle.cy - geo.craniumCircle.r}
            width={geo.craniumCircle.r * 2}
            height={geo.craniumCircle.r * 2}
            style="stroke"
            strokeWidth={2.4 * strokeScale}
            color="#28594B"
          />
        </Group>
      )}

      {/* STAGE 2: Brow Axis & Centerline */}
      {stage >= 2 && (
        <Group>
          <Path
            path={browPath}
            style="stroke"
            strokeWidth={2.2 * strokeScale}
            color="#CB7857"
            strokeCap="round"
          />
          <Path
            path={centerPath}
            style="stroke"
            strokeWidth={2.4 * strokeScale}
            color="#CB7857"
            strokeCap="round"
          />
        </Group>
      )}

      {/* STAGE 3: Side Plane Flattened Disc */}
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
            strokeWidth={2.0 * strokeScale}
            color="#D5A844"
          />
          <Line
            p1={{ x: geo.sideDiscCrossAxes.horizontal[0].x, y: geo.sideDiscCrossAxes.horizontal[0].y }}
            p2={{ x: geo.sideDiscCrossAxes.horizontal[1].x, y: geo.sideDiscCrossAxes.horizontal[1].y }}
            style="stroke"
            strokeWidth={1.4 * strokeScale}
            color="#D5A844"
          />
          <Line
            p1={{ x: geo.sideDiscCrossAxes.vertical[0].x, y: geo.sideDiscCrossAxes.vertical[0].y }}
            p2={{ x: geo.sideDiscCrossAxes.vertical[1].x, y: geo.sideDiscCrossAxes.vertical[1].y }}
            style="stroke"
            strokeWidth={1.4 * strokeScale}
            color="#D5A844"
          />
        </Group>
      )}

      {/* STAGE 4: Jawline Construction */}
      {stage >= 4 && (
        <Path
          path={jawPath}
          style="stroke"
          strokeWidth={2.6 * strokeScale}
          color="#596A94"
          strokeCap="round"
          strokeJoin="round"
        />
      )}

      {/* STAGE 5: Facial Thirds Division */}
      {stage >= 5 && (
        <Group>
          {geo.facialThirdsLines.map((third, idx) => (
            <Line
              key={idx}
              p1={{ x: third.line[0].x, y: third.line[0].y }}
              p2={{ x: third.line[1].x, y: third.line[1].y }}
              style="stroke"
              strokeWidth={1.6 * strokeScale}
              color="#8B4F69"
            />
          ))}
        </Group>
      )}

      {/* STAGE 6: Feature Block-In */}
      {stage >= 6 && (
        <Group>
          <Line
            p1={{ x: geo.featureBlockIn.eyeLine[0].x, y: geo.featureBlockIn.eyeLine[0].y }}
            p2={{ x: geo.featureBlockIn.eyeLine[1].x, y: geo.featureBlockIn.eyeLine[1].y }}
            style="stroke"
            strokeWidth={1.6 * strokeScale}
            color="#1C211D"
          />
          <Path
            path={leftSocketPath}
            style="stroke"
            strokeWidth={1.8 * strokeScale}
            color="#1C211D"
          />
          <Path
            path={rightSocketPath}
            style="stroke"
            strokeWidth={1.8 * strokeScale}
            color="#1C211D"
          />
          <Path
            path={nosePath}
            style="stroke"
            strokeWidth={2.0 * strokeScale}
            color="#1C211D"
          />
          <Line
            p1={{ x: geo.featureBlockIn.mouthLine[0].x, y: geo.featureBlockIn.mouthLine[0].y }}
            p2={{ x: geo.featureBlockIn.mouthLine[1].x, y: geo.featureBlockIn.mouthLine[1].y }}
            style="stroke"
            strokeWidth={2.2 * strokeScale}
            color="#1C211D"
            strokeCap="round"
          />
          <Path
            path={earPath}
            style="stroke"
            strokeWidth={1.8 * strokeScale}
            color="#1C211D"
            strokeCap="round"
          />
        </Group>
      )}

      {/* STAGE 7: Planes of the Face */}
      {stage >= 7 && (
        <Group>
          {geo.facePlanes.map((plane, idx) => {
            const builder = Skia.PathBuilder.Make();
            if (plane.polygon.length > 0) {
              builder.moveTo(plane.polygon[0]!.x, plane.polygon[0]!.y);
              for (let i = 1; i < plane.polygon.length; i++) builder.lineTo(plane.polygon[i]!.x, plane.polygon[i]!.y);
              builder.close();
            }
            return (
              <Path
                key={idx}
                path={builder.build()}
                style="stroke"
                strokeWidth={1.4 * strokeScale}
                color="#3B7A57"
              />
            );
          })}
        </Group>
      )}

      {/* STAGE 8: Planar Tonal Mapping & Shadow Boundaries */}
      {stage >= 8 && (
        <Group>
          {geo.shadowPlanes.map((shadow, idx) => {
            const builder = Skia.PathBuilder.Make();
            if (shadow.polygon.length > 0) {
              builder.moveTo(shadow.polygon[0]!.x, shadow.polygon[0]!.y);
              for (let i = 1; i < shadow.polygon.length; i++) builder.lineTo(shadow.polygon[i]!.x, shadow.polygon[i]!.y);
              builder.close();
            }
            return (
              <Group key={idx}>
                <Path
                  path={builder.build()}
                  style="fill"
                  color={`rgba(23, 32, 28, ${shadow.opacity})`}
                />
                <Path
                  path={builder.build()}
                  style="stroke"
                  strokeWidth={2.0 * strokeScale}
                  color="#17201C"
                />
              </Group>
            );
          })}
        </Group>
      )}
    </Group>
  );
}
