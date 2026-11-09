import { useMemo } from "react";
import { Circle, Group, Line, Rect, Skia } from "@shopify/react-native-skia";
import { calculateGrid, type GridConfig } from "./GridEngine";

type Props = {
  width: number;
  height: number;
  config: GridConfig;
};

export function GridSkiaOverlay({ width, height, config }: Props) {
  const data = useMemo(() => calculateGrid(width, height, config), [width, height, config]);

  const selectedCellRect = useMemo(() => {
    if (!config.selectedCell) return null;
    return data.cells.find(
      (c) => c.col === config.selectedCell?.col && c.row === config.selectedCell?.row
    );
  }, [data.cells, config.selectedCell]);

  return (
    <Group opacity={config.opacity}>
      {/* Outer Border */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        style="stroke"
        strokeWidth={config.strokeWidth * 1.5}
        color={config.color}
      />

      {/* Grid Lines */}
      {data.lines.map((line, idx) => (
        <Line
          key={`line-${idx}`}
          p1={line.p1}
          p2={line.p2}
          style="stroke"
          strokeWidth={line.isMajor ? config.strokeWidth * 1.3 : config.strokeWidth}
          color={config.color}
        />
      ))}

      {/* Diagonal Lines */}
      {data.diagonalLines.map((diag, idx) => (
        <Line
          key={`diag-${idx}`}
          p1={diag.p1}
          p2={diag.p2}
          style="stroke"
          strokeWidth={diag.isMajor ? config.strokeWidth * 1.2 : config.strokeWidth * 0.75}
          color={config.color}
          opacity={0.65}
        />
      ))}

      {/* Focal Points for Rule of Thirds / Golden Ratio */}
      {data.focalPoints.map((pt, idx) => (
        <Group key={`focal-${idx}`}>
          <Circle cx={pt.x} cy={pt.y} r={6} style="stroke" strokeWidth={2} color="#CB7857" />
          <Circle cx={pt.x} cy={pt.y} r={2.5} style="fill" color="#CB7857" />
        </Group>
      ))}

      {/* Highlight on selected focused cell */}
      {selectedCellRect && (
        <Group>
          <Rect
            x={selectedCellRect.x}
            y={selectedCellRect.y}
            width={selectedCellRect.width}
            height={selectedCellRect.height}
            style="fill"
            color="rgba(203, 120, 87, 0.22)"
          />
          <Rect
            x={selectedCellRect.x}
            y={selectedCellRect.y}
            width={selectedCellRect.width}
            height={selectedCellRect.height}
            style="stroke"
            strokeWidth={3}
            color="#CB7857"
          />
        </Group>
      )}
    </Group>
  );
}
