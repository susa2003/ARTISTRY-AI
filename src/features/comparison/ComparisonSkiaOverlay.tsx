import React, { useMemo } from "react";
import { Circle, Group, Image as SkiaImage, Line, Rect, Skia, Text as SkiaText, useFont } from "@shopify/react-native-skia";
import type { ComparisonConfig } from "./ComparisonEngine";

type Props = {
  width: number;
  height: number;
  config: ComparisonConfig;
  referenceImage: ReturnType<typeof Skia.Image.MakeImageFromEncoded> | null;
  drawingImage?: ReturnType<typeof Skia.Image.MakeImageFromEncoded> | null;
  differenceImage?: ReturnType<typeof Skia.Image.MakeImageFromEncoded> | null;
  matchScore?: number;
};

export function ComparisonSkiaOverlay({
  width,
  height,
  config,
  referenceImage,
  drawingImage,
  differenceImage,
  matchScore,
}: Props) {
  const splitX = Math.max(10, Math.min(width - 10, width * config.splitPosition));
  const plumbX = width * config.plumbX;
  const plumbY = height * config.plumbY;

  // Clip rects for split screen
  const leftClip = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.addRect({ x: 0, y: 0, width: splitX, height });
    return p.build();
  }, [splitX, height]);

  const rightClip = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.addRect({ x: splitX, y: 0, width: width - splitX, height });
    return p.build();
  }, [splitX, width, height]);

  return (
    <Group>
      {/* 1. SPLIT SCREEN MODE */}
      {config.mode === "split" && (
        <Group>
          {/* Left half: Reference image */}
          {referenceImage && (
            <Group clip={leftClip}>
              <SkiaImage
                image={referenceImage}
                x={0}
                y={0}
                width={width}
                height={height}
                fit="fill"
              />
            </Group>
          )}

          {/* Right half: User drawing or tonal sketch */}
          {drawingImage ? (
            <Group clip={rightClip}>
              <SkiaImage
                image={drawingImage}
                x={0}
                y={0}
                width={width}
                height={height}
                fit="fill"
              />
            </Group>
          ) : (
            <Group clip={rightClip}>
              {/* Subtle canvas paper texture & guide indication when drawing is empty */}
              <Rect x={splitX} y={0} width={width - splitX} height={height} color="#F9F7F1" />
              {referenceImage && (
                <Group opacity={0.35}>
                  <SkiaImage
                    image={referenceImage}
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fit="fill"
                  />
                </Group>
              )}
            </Group>
          )}

          {/* Vertical divider line */}
          <Line
            p1={{ x: splitX, y: 0 }}
            p2={{ x: splitX, y: height }}
            color="#CB7857"
            strokeWidth={2.4}
            style="stroke"
          />

          {/* Draggable center handle */}
          <Circle cx={splitX} cy={height / 2} r={14} color="#CB7857" />
          <Circle cx={splitX} cy={height / 2} r={12} color="#FFFFFF" />
          <Circle cx={splitX} cy={height / 2} r={4} color="#CB7857" />

          {/* Arrow notches on handle */}
          <Line
            p1={{ x: splitX - 7, y: height / 2 }}
            p2={{ x: splitX - 3, y: height / 2 - 4 }}
            color="#CB7857"
            strokeWidth={1.8}
            style="stroke"
          />
          <Line
            p1={{ x: splitX - 7, y: height / 2 }}
            p2={{ x: splitX - 3, y: height / 2 + 4 }}
            color="#CB7857"
            strokeWidth={1.8}
            style="stroke"
          />
          <Line
            p1={{ x: splitX + 7, y: height / 2 }}
            p2={{ x: splitX + 3, y: height / 2 - 4 }}
            color="#CB7857"
            strokeWidth={1.8}
            style="stroke"
          />
          <Line
            p1={{ x: splitX + 7, y: height / 2 }}
            p2={{ x: splitX + 3, y: height / 2 + 4 }}
            color="#CB7857"
            strokeWidth={1.8}
            style="stroke"
          />
        </Group>
      )}

      {/* 2. ONION SKINNING MODE */}
      {config.mode === "onion" && (
        <Group>
          {/* Base drawing */}
          {drawingImage && (
            <SkiaImage
              image={drawingImage}
              x={0}
              y={0}
              width={width}
              height={height}
              fit="fill"
            />
          )}

          {/* Reference overlaid with adjustable opacity */}
          {referenceImage && (
            <Group opacity={config.onionOpacity}>
              <SkiaImage
                image={referenceImage}
                x={0}
                y={0}
                width={width}
                height={height}
                fit="fill"
              />
            </Group>
          )}
        </Group>
      )}

      {/* 3. DIFFERENCE HEATMAP MODE */}
      {config.mode === "difference" && (
        <Group>
          {differenceImage ? (
            <SkiaImage
              image={differenceImage}
              x={0}
              y={0}
              width={width}
              height={height}
              fit="fill"
            />
          ) : (
            // Fallback while difference map is processing or when single image is loaded
            <Group>
              {referenceImage && (
                <Group opacity={0.65}>
                  <SkiaImage
                    image={referenceImage}
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fit="fill"
                  />
                </Group>
              )}
            </Group>
          )}
        </Group>
      )}

      {/* 4. PLUMB LINES (ATELIER SIGHT-SIZE MEASUREMENT GUIDES) */}
      {(config.mode === "plumb" || config.showPlumbLines) && (
        <Group>
          {/* Vertical plumb line */}
          <Line
            p1={{ x: plumbX, y: 0 }}
            p2={{ x: plumbX, y: height }}
            color="#D5A844"
            strokeWidth={1.6}
            style="stroke"
          />
          {/* Horizontal level line */}
          <Line
            p1={{ x: 0, y: plumbY }}
            p2={{ x: width, y: plumbY }}
            color="#D5A844"
            strokeWidth={1.6}
            style="stroke"
          />
          {/* Crosshair anchor */}
          <Circle cx={plumbX} cy={plumbY} r={8} color="#D5A844" style="stroke" strokeWidth={1.6} />
          <Circle cx={plumbX} cy={plumbY} r={3} color="#CB7857" />
        </Group>
      )}
    </Group>
  );
}
