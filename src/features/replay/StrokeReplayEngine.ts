import type { ProjectDocument, Stroke, StrokeEvent, StrokeReplayRecord } from "../../domain/types";
import * as database from "../../storage/database";
import { createId } from "../../storage/imageFiles";

export function extractStrokeEvents(project: ProjectDocument): StrokeEvent[] {
  const events: StrokeEvent[] = [];
  let baseTime = project.createdAt;

  project.layers.forEach((layer) => {
    layer.strokes.forEach((stroke) => {
      const strokeTime = stroke.timestamp ?? baseTime;
      stroke.points.forEach((pt, ptIdx) => {
        events.push({
          strokeId: stroke.id,
          pointIndex: ptIdx,
          x: pt.x,
          y: pt.y,
          pressure: pt.pressure,
          timestamp: strokeTime + ptIdx * 25, // 25ms per sampled point
          kind: stroke.kind,
          color: stroke.color,
          width: stroke.width,
        });
      });
      baseTime = strokeTime + stroke.points.length * 25 + 100;
    });
  });

  events.sort((a, b) => a.timestamp - b.timestamp);
  return events;
}

export function reconstructStrokesUpTo(events: StrokeEvent[], targetIndex: number): Stroke[] {
  const strokeMap = new Map<string, Stroke>();
  const order: string[] = [];

  for (let i = 0; i <= targetIndex && i < events.length; i++) {
    const ev = events[i]!;
    let stroke = strokeMap.get(ev.strokeId);
    if (!stroke) {
      stroke = {
        id: ev.strokeId,
        kind: ev.kind,
        color: ev.color,
        width: ev.width,
        points: [],
      };
      strokeMap.set(ev.strokeId, stroke);
      order.push(ev.strokeId);
    }
    stroke.points.push({ x: ev.x, y: ev.y, pressure: ev.pressure });
  }

  return order.map((id) => strokeMap.get(id)!);
}

export async function persistProjectReplay(project: ProjectDocument): Promise<StrokeReplayRecord> {
  const events = extractStrokeEvents(project);
  const durationMs = events.length > 0 ? events[events.length - 1]!.timestamp - events[0]!.timestamp : 0;

  const record: StrokeReplayRecord = {
    id: createId(),
    projectId: project.id,
    events,
    durationMs,
    createdAt: Date.now(),
  };

  await database.saveStrokeReplay(record);
  return record;
}

export async function loadProjectReplay(projectId: string): Promise<StrokeReplayRecord | null> {
  return database.getStrokeReplay(projectId);
}
