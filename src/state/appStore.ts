import { create } from "zustand";
import type {
  BrushKind,
  DrawingLayer,
  ExperienceMode,
  LocalReference,
  ProjectDocument,
  ProjectSummary,
  Stroke,
  UndoSnapshot,
} from "../domain/types";
import type { SmoothingLevel } from "../features/drawing/StrokeSmoothing";
import * as database from "../storage/database";
import { createId } from "../storage/imageFiles";

const CANVAS_HEIGHT = 1400;

function firstLayer(): DrawingLayer {
  return { id: createId(), name: "Layer 1", visible: true, opacity: 1, strokes: [] };
}

function snapshot(project: ProjectDocument): UndoSnapshot {
  return { layers: project.layers, activeLayerId: project.activeLayerId };
}

type AppStore = {
  ready: boolean;
  projects: ProjectSummary[];
  currentProject: ProjectDocument | null;
  reference: LocalReference | null;
  tool: BrushKind;
  color: string;
  brushSize: number;
  smoothing: SmoothingLevel;
  past: UndoSnapshot[];
  future: UndoSnapshot[];
  hydrate: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  setReference: (reference: LocalReference) => Promise<void>;
  clearReference: () => Promise<void>;
  createProject: (referenceUri?: string | null, name?: string) => Promise<string>;
  openProject: (id: string) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setTool: (tool: BrushKind) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setSmoothing: (smoothing: SmoothingLevel) => void;
  commitStroke: (stroke: Stroke) => void;
  addLayer: () => void;
  deleteLayer: (id: string) => void;
  toggleLayer: (id: string) => void;
  selectLayer: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  moveLayer: (id: string, direction: "up" | "down") => void;
  duplicateLayer: (id: string) => void;
  clearLayer: (id: string) => void;
  setReferenceOpacity: (opacity: number) => void;
  importStrokesToLayer: (layerName: string, strokes: Stroke[]) => void;
  undo: () => void;
  redo: () => void;
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => Promise<void>;
  language: "en" | "ta";
  setLanguage: (lang: "en" | "ta") => Promise<void>;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  setActiveBrush: (brush: "brush" | "pencil" | "pen" | "eraser") => void;
  clearActiveLayer: () => void;
  lessonProgress: Record<string, boolean>;
  streak: { current: number; longest: number; lastActiveDate: string | null };
  loadLearningProgress: () => Promise<void>;
  toggleLessonCompletion: (lessonId: string) => Promise<void>;
  completeDailyChallenge: (title: string, projectId?: string) => Promise<number>;
};

export const useAppStore = create<AppStore>((set, get) => ({
  ready: false,
  projects: [],
  currentProject: null,
  reference: null,
  tool: "brush",
  color: "#1C211D",
  brushSize: 8,
  smoothing: "medium",
  past: [],
  future: [],
  experienceMode: "beginner",
  language: "en",
  onboardingCompleted: false,
  lessonProgress: {},
  streak: { current: 0, longest: 0, lastActiveDate: null },
  hydrate: async () => {
    const [projects, reference, lessons, streakData, mode, lang, onboardingDone] = await Promise.all([
      database.listProjects(),
      database.getActiveReference(),
      database.getLessonProgress(),
      database.getStreakData(),
      database.getExperienceMode(),
      database.getAppLanguage(),
      database.getOnboardingCompleted(),
    ]);
    const progressMap: Record<string, boolean> = {};
    Object.keys(lessons).forEach((id) => {
      progressMap[id] = lessons[id]?.completed ?? false;
    });
    set({
      ready: true,
      projects,
      reference,
      experienceMode: mode,
      language: lang,
      onboardingCompleted: onboardingDone,
      lessonProgress: progressMap,
      streak: {
        current: streakData.currentStreak,
        longest: streakData.longestStreak,
        lastActiveDate: streakData.lastActiveDate,
      },
    });
  },
  setOnboardingCompleted: async (completed) => {
    await database.setOnboardingCompleted(completed);
    set({ onboardingCompleted: completed });
  },
  setExperienceMode: async (mode) => {
    await database.setExperienceMode(mode);
    set({ experienceMode: mode });
  },
  setLanguage: async (lang) => {
    await database.setAppLanguage(lang);
    set({ language: lang });
  },
  setActiveBrush: (brush) => {
    set({ tool: brush });
  },
  clearActiveLayer: () => {
    const project = get().currentProject;
    if (!project) return;
    get().clearLayer(project.activeLayerId);
  },
  loadLearningProgress: async () => {
    const [lessons, streakData] = await Promise.all([
      database.getLessonProgress(),
      database.getStreakData(),
    ]);
    const progressMap: Record<string, boolean> = {};
    Object.keys(lessons).forEach((id) => {
      progressMap[id] = lessons[id]?.completed ?? false;
    });
    set({
      lessonProgress: progressMap,
      streak: {
        current: streakData.currentStreak,
        longest: streakData.longestStreak,
        lastActiveDate: streakData.lastActiveDate,
      },
    });
  },
  toggleLessonCompletion: async (lessonId) => {
    const currentStatus = get().lessonProgress[lessonId] ?? false;
    const nextStatus = !currentStatus;
    await database.recordLessonProgress(lessonId, nextStatus);
    set((state) => ({
      lessonProgress: { ...state.lessonProgress, [lessonId]: nextStatus },
    }));
  },
  completeDailyChallenge: async (title, projectId) => {
    const result = await database.recordChallengeCompletion(title, projectId);
    const streakData = await database.getStreakData();
    set({
      streak: {
        current: streakData.currentStreak,
        longest: streakData.longestStreak,
        lastActiveDate: streakData.lastActiveDate,
      },
    });
    return result.streak;
  },
  refreshProjects: async () => set({ projects: await database.listProjects() }),
  setReference: async (reference) => {
    await database.saveReference(reference);
    set({ reference });
  },
  clearReference: async () => {
    await database.clearActiveReference();
    set({ reference: null });
  },
  createProject: async (referenceUri = null, name = "Untitled drawing") => {
    const now = Date.now();
    const layer = firstLayer();
    const reference = get().reference;
    const width = 1000;
    const height = referenceUri && reference?.uri === referenceUri
      ? Math.max(400, Math.min(2400, Math.round(width * reference.height / Math.max(1, reference.width))))
      : CANVAS_HEIGHT;
    const project: ProjectDocument = {
      id: createId(), name, width, height,
      layers: [layer], activeLayerId: layer.id, referenceUri, createdAt: now, updatedAt: now,
    };
    await database.saveProject(project);
    set({ currentProject: project, projects: await database.listProjects(), past: [], future: [] });
    return project.id;
  },
  openProject: async (id) => {
    const project = await database.getProject(id);
    if (!project) throw new Error("This local drawing could not be found.");
    set({ currentProject: project, past: [], future: [] });
  },
  saveCurrentProject: async () => {
    const project = get().currentProject;
    if (!project) return;
    const updated = { ...project, updatedAt: Date.now() };
    await database.saveProject(updated);
    set({ projects: await database.listProjects() });
  },
  renameProject: async (id, name) => {
    const project = await database.getProject(id);
    if (!project) return;
    const updated = { ...project, name: name.trim() || "Untitled drawing", updatedAt: Date.now() };
    await database.saveProject(updated);
    set((state) => ({
      projects: state.projects.map((item) => item.id === id ? { ...item, name: updated.name, updatedAt: updated.updatedAt } : item),
      currentProject: state.currentProject?.id === id ? updated : state.currentProject,
    }));
  },
  deleteProject: async (id) => {
    await database.removeProject(id);
    set((state) => ({ projects: state.projects.filter((project) => project.id !== id), currentProject: state.currentProject?.id === id ? null : state.currentProject }));
  },
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(60, Math.round(size))) }),
  setSmoothing: (smoothing) => set({ smoothing }),
  commitStroke: (stroke) => set((state) => {
    const project = state.currentProject;
    if (!project) return {};
    const now = Date.now();
    const stampedStroke: Stroke = {
      ...stroke,
      timestamp: stroke.timestamp ?? now,
      startTime: stroke.startTime ?? now,
    };
    const layers = project.layers.map((layer) => layer.id === project.activeLayerId ? { ...layer, strokes: [...layer.strokes, stampedStroke] } : layer);
    return {
      currentProject: { ...project, layers, updatedAt: now },
      past: [...state.past.slice(-49), snapshot(project)],
      future: [],
    };
  }),
  addLayer: () => set((state) => {
    if (!state.currentProject) return {};
    const project = state.currentProject;
    const layer: DrawingLayer = { ...firstLayer(), name: `Layer ${project.layers.length + 1}` };
    return {
      currentProject: { ...project, layers: [...project.layers, layer], activeLayerId: layer.id, updatedAt: Date.now() },
      past: [...state.past.slice(-49), snapshot(project)], future: [],
    };
  }),
  deleteLayer: (id) => set((state) => {
    const project = state.currentProject;
    if (!project || project.layers.length <= 1) return {};
    const layers = project.layers.filter((layer) => layer.id !== id);
    const activeLayerId = project.activeLayerId === id ? layers[layers.length - 1].id : project.activeLayerId;
    return { currentProject: { ...project, layers, activeLayerId, updatedAt: Date.now() }, past: [...state.past.slice(-49), snapshot(project)], future: [] };
  }),
  toggleLayer: (id) => set((state) => {
    const project = state.currentProject;
    if (!project) return {};
    const layers = project.layers.map((layer) => layer.id === id ? { ...layer, visible: !layer.visible } : layer);
    return { currentProject: { ...project, layers, updatedAt: Date.now() }, past: [...state.past.slice(-49), snapshot(project)], future: [] };
  }),
  selectLayer: (id) => set((state) => ({ currentProject: state.currentProject ? { ...state.currentProject, activeLayerId: id } : null })),
  renameLayer: (id, name) => set((state) => ({ currentProject: state.currentProject ? {
    ...state.currentProject, layers: state.currentProject.layers.map((layer) => layer.id === id ? { ...layer, name: name.trim() || layer.name } : layer),
  } : null })),
  setLayerOpacity: (id, opacity) => set((state) => {
    const project = state.currentProject;
    if (!project) return {};
    const safeOpacity = Math.max(0.05, Math.min(1.0, opacity));
    const layers = project.layers.map((layer) => layer.id === id ? { ...layer, opacity: safeOpacity } : layer);
    return { currentProject: { ...project, layers, updatedAt: Date.now() } };
  }),
  moveLayer: (id, direction) => set((state) => {
    const project = state.currentProject;
    if (!project || project.layers.length <= 1) return {};
    const idx = project.layers.findIndex((l) => l.id === id);
    if (idx === -1) return {};
    const targetIdx = direction === "up" ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= project.layers.length) return {};
    const nextLayers = [...project.layers];
    const [moved] = nextLayers.splice(idx, 1);
    nextLayers.splice(targetIdx, 0, moved!);
    return {
      currentProject: { ...project, layers: nextLayers, updatedAt: Date.now() },
      past: [...state.past.slice(-49), snapshot(project)], future: [],
    };
  }),
  duplicateLayer: (id) => set((state) => {
    const project = state.currentProject;
    if (!project) return {};
    const target = project.layers.find((l) => l.id === id);
    if (!target) return {};
    const copy: DrawingLayer = {
      id: createId(),
      name: `${target.name} copy`,
      visible: true,
      opacity: target.opacity,
      strokes: target.strokes.map((s) => ({ ...s, id: createId(), points: [...s.points] })),
    };
    return {
      currentProject: { ...project, layers: [...project.layers, copy], activeLayerId: copy.id, updatedAt: Date.now() },
      past: [...state.past.slice(-49), snapshot(project)], future: [],
    };
  }),
  clearLayer: (id) => set((state) => {
    const project = state.currentProject;
    if (!project) return {};
    const layers = project.layers.map((l) => l.id === id ? { ...l, strokes: [] } : l);
    return {
      currentProject: { ...project, layers, updatedAt: Date.now() },
      past: [...state.past.slice(-49), snapshot(project)], future: [],
    };
  }),
  setReferenceOpacity: (opacity) => set((state) => {
    const project = state.currentProject;
    if (!project) return {};
    return { currentProject: { ...project, referenceOpacity: Math.max(0.05, Math.min(1.0, opacity)), updatedAt: Date.now() } };
  }),
  importStrokesToLayer: (layerName, strokes) => set((state) => {
    const project = state.currentProject;
    if (!project) return {};
    const newLayer: DrawingLayer = {
      id: createId(),
      name: layerName,
      visible: true,
      opacity: 0.9,
      strokes,
    };
    return {
      currentProject: { ...project, layers: [...project.layers, newLayer], activeLayerId: newLayer.id, updatedAt: Date.now() },
      past: [...state.past.slice(-49), snapshot(project)], future: [],
    };
  }),
  undo: () => set((state) => {
    const current = state.currentProject;
    if (!current || state.past.length === 0) return {};
    const previous = state.past[state.past.length - 1];
    return {
      currentProject: { ...current, ...previous, updatedAt: Date.now() },
      past: state.past.slice(0, -1),
      future: [...state.future, snapshot(current)],
    };
  }),
  redo: () => set((state) => {
    const current = state.currentProject;
    if (!current || state.future.length === 0) return {};
    const next = state.future[state.future.length - 1];
    return {
      currentProject: { ...current, ...next, updatedAt: Date.now() },
      future: state.future.slice(0, -1),
      past: [...state.past, snapshot(current)],
    };
  }),
}));
