import type { ProjectDocument } from "../../../domain/types";
import {
  extractStrokeEvents,
  persistProjectReplay,
  loadProjectReplay,
  reconstructStrokesUpTo,
} from "../StrokeReplayEngine";

describe("StrokeReplayEngine", () => {
  const dummyProject: ProjectDocument = {
    id: "proj-replay-test",
    name: "Replay Test",
    width: 1000,
    height: 1400,
    layers: [
      {
        id: "layer-1",
        name: "Layer 1",
        visible: true,
        opacity: 1,
        strokes: [
          {
            id: "stroke-1",
            kind: "brush",
            color: "#000000",
            width: 5,
            points: [
              { x: 10, y: 10 },
              { x: 20, y: 20 },
              { x: 30, y: 30 },
            ],
            timestamp: 1000,
          },
        ],
      },
    ],
    activeLayerId: "layer-1",
    createdAt: 1000,
    updatedAt: 1100,
  };

  test("extracts chronological stroke events and reconstructs steps", () => {
    const events = extractStrokeEvents(dummyProject);
    expect(events.length).toBe(3);
    expect(events[0]?.strokeId).toBe("stroke-1");
    expect(events[0]?.x).toBe(10);
    expect(events[2]?.x).toBe(30);

    const partialStrokes = reconstructStrokesUpTo(events, 1);
    expect(partialStrokes.length).toBe(1);
    expect(partialStrokes[0]?.points.length).toBe(2);
  });

  test("persists and loads replay records", async () => {
    const record = await persistProjectReplay(dummyProject);
    expect(record.projectId).toBe(dummyProject.id);

    const loaded = await loadProjectReplay(dummyProject.id);
    expect(loaded).toBeDefined();
    expect(loaded?.events.length).toBe(3);
  });
});
