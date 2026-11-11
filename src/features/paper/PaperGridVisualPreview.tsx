/**
 * ARTISTRY AI — Live Paper Grid Visual Preview
 * Renders an aspect-ratio-accurate vector preview of physical paper,
 * real grid lines, alphanumeric row/column coordinates, and leftover margins.
 */

import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import type { PaperGridCalculation } from "./types";
import { getColumnLetter } from "./paperGridCalculator";

interface PaperGridVisualPreviewProps {
  calculation: PaperGridCalculation;
  previewHeight?: number;
}

export function PaperGridVisualPreview({
  calculation,
  previewHeight = 280,
}: PaperGridVisualPreviewProps) {
  const {
    paperSize,
    orientation,
    paperWidthMm,
    paperHeightMm,
    columns,
    rows,
    spacingXMm,
    spacingYMm,
    marginXMm,
    marginYMm,
    totalGridWidthMm,
    totalGridHeightMm,
    remainderXMm,
    remainderYMm,
  } = calculation;

  // Calculate container aspect fit
  const { previewWidth, scale } = useMemo(() => {
    const aspect = paperWidthMm / Math.max(1, paperHeightMm);
    const calculatedWidth = previewHeight * aspect;
    const s = calculatedWidth / paperWidthMm;
    return { previewWidth: Math.round(calculatedWidth), scale: s };
  }, [paperWidthMm, paperHeightMm, previewHeight]);

  // Generate SVG lines data
  const { vLines, hLines, colLabels, rowLabels } = useMemo(() => {
    const v: number[] = [];
    const h: number[] = [];
    const cl: Array<{ x: number; text: string }> = [];
    const rl: Array<{ y: number; text: string }> = [];

    // Vertical grid lines
    for (let c = 0; c <= columns; c++) {
      v.push(marginXMm + c * spacingXMm);
    }

    // Horizontal grid lines
    for (let r = 0; r <= rows; r++) {
      h.push(marginYMm + r * spacingYMm);
    }

    // Column lettering (limit labels if too dense)
    const colStep = columns > 30 ? 5 : columns > 15 ? 2 : 1;
    for (let c = 0; c < columns; c += colStep) {
      cl.push({
        x: marginXMm + c * spacingXMm + spacingXMm / 2,
        text: getColumnLetter(c),
      });
    }

    // Row numbering (limit labels if too dense)
    const rowStep = rows > 30 ? 5 : rows > 15 ? 2 : 1;
    for (let r = 0; r < rows; r += rowStep) {
      rl.push({
        y: marginYMm + r * spacingYMm + spacingYMm / 2 + 1.2,
        text: String(r + 1),
      });
    }

    return { vLines: v, hLines: h, colLabels: cl, rowLabels: rl };
  }, [columns, rows, spacingXMm, spacingYMm, marginXMm, marginYMm]);

  return (
    <View style={styles.container}>
      {/* Aspect-Accurate Paper Canvas */}
      <View
        style={[
          styles.paperSheet,
          {
            width: previewWidth,
            height: previewHeight,
          },
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${paperWidthMm} ${paperHeightMm}`}
          style={styles.svg}
        >
          {/* Background Paper Sheet */}
          <Rect
            x={0}
            y={0}
            width={paperWidthMm}
            height={paperHeightMm}
            fill="#FAF8F2"
            stroke="#DCD6C8"
            strokeWidth={0.8}
          />

          {/* Leftover Margins Indicator Area */}
          {(remainderXMm > 0 || remainderYMm > 0) && (
            <Rect
              x={0}
              y={0}
              width={paperWidthMm}
              height={paperHeightMm}
              fill="rgba(215, 120, 80, 0.06)"
              stroke="#CB7857"
              strokeWidth={0.4}
              strokeDasharray="2,2"
            />
          )}

          {/* Active Grid Bounding Box */}
          <Rect
            x={marginXMm}
            y={marginYMm}
            width={totalGridWidthMm}
            height={totalGridHeightMm}
            fill="#FFFFFF"
            stroke="#28594B"
            strokeWidth={0.8}
          />

          {/* Vertical Grid Lines */}
          <G id="v-lines">
            {vLines.map((x, idx) => (
              <Line
                key={`vl-${idx}`}
                x1={x}
                y1={marginYMm}
                x2={x}
                y2={marginYMm + totalGridHeightMm}
                stroke="#28594B"
                strokeWidth={idx === 0 || idx === columns ? 0.6 : 0.3}
                opacity={idx === 0 || idx === columns ? 0.9 : 0.6}
              />
            ))}
          </G>

          {/* Horizontal Grid Lines */}
          <G id="h-lines">
            {hLines.map((y, idx) => (
              <Line
                key={`hl-${idx}`}
                x1={marginXMm}
                y1={y}
                x2={marginXMm + totalGridWidthMm}
                y2={y}
                stroke="#28594B"
                strokeWidth={idx === 0 || idx === rows ? 0.6 : 0.3}
                opacity={idx === 0 || idx === rows ? 0.9 : 0.6}
              />
            ))}
          </G>

          {/* Column Letters (A, B, C...) */}
          <G id="col-labels">
            {colLabels.map((lbl, idx) => (
              <SvgText
                key={`cl-${idx}`}
                x={lbl.x}
                y={Math.max(3.5, marginYMm - 2)}
                fontSize={Math.max(2.2, Math.min(4.5, spacingXMm * 0.4))}
                fill="#28594B"
                fontWeight="bold"
                textAnchor="middle"
              >
                {lbl.text}
              </SvgText>
            ))}
          </G>

          {/* Row Numbers (1, 2, 3...) */}
          <G id="row-labels">
            {rowLabels.map((lbl, idx) => (
              <SvgText
                key={`rl-${idx}`}
                x={Math.max(2.5, marginXMm - 2)}
                y={lbl.y}
                fontSize={Math.max(2.2, Math.min(4.5, spacingYMm * 0.4))}
                fill="#28594B"
                fontWeight="bold"
                textAnchor="end"
              >
                {lbl.text}
              </SvgText>
            ))}
          </G>
        </Svg>

        {/* Paper Dimension Corner Tags */}
        <View style={styles.topDimTag}>
          <Text style={styles.dimTagText}>{paperWidthMm} mm</Text>
        </View>
        <View style={styles.leftDimTag}>
          <Text style={styles.dimTagText}>{paperHeightMm} mm</Text>
        </View>
      </View>

      {/* Live Measurement Callout Footnotes */}
      <View style={styles.footnotesRow}>
        <View style={styles.footnoteBadge}>
          <Text style={styles.footnoteLabel}>Paper:</Text>
          <Text style={styles.footnoteValue}>
            {paperSize} {orientation} ({paperWidthMm}×{paperHeightMm}mm)
          </Text>
        </View>

        <View style={styles.footnoteBadge}>
          <Text style={styles.footnoteLabel}>Active Grid:</Text>
          <Text style={styles.footnoteValueMoss}>
            {columns} cols × {rows} rows ({totalGridWidthMm}×{totalGridHeightMm}mm)
          </Text>
        </View>

        <View style={styles.footnoteBadge}>
          <Text style={styles.footnoteLabel}>Remainder Margins:</Text>
          <Text style={styles.footnoteValueClay}>
            X: {remainderXMm}mm (±{marginXMm}mm) · Y: {remainderYMm}mm (±{marginYMm}mm)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  paperSheet: {
    backgroundColor: "#FAF8F2",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DCD6C8",
    position: "relative",
  },
  svg: {
    flex: 1,
  },
  topDimTag: {
    position: "absolute",
    top: 4,
    right: 6,
    backgroundColor: "rgba(25, 33, 28, 0.75)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  leftDimTag: {
    position: "absolute",
    bottom: 4,
    left: 6,
    backgroundColor: "rgba(25, 33, 28, 0.75)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dimTagText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
  },
  footnotesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    maxWidth: 520,
  },
  footnoteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C2420",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: "#29362F",
  },
  footnoteLabel: {
    fontSize: 10,
    color: "#8B9A90",
    fontWeight: "600",
  },
  footnoteValue: {
    fontSize: 10,
    color: "#E5E3DC",
    fontWeight: "700",
  },
  footnoteValueMoss: {
    fontSize: 10,
    color: "#6CD498",
    fontWeight: "700",
  },
  footnoteValueClay: {
    fontSize: 10,
    color: "#E2934D",
    fontWeight: "700",
  },
});
