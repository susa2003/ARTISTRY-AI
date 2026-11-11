// Mock react-native
jest.mock("react-native", () => ({
  Image: {
    getSize: jest.fn((uri, success) => success(800, 1000)),
  },
  Platform: {
    OS: "android",
    select: jest.fn((dict) => dict.android ?? dict.default),
  },
  StyleSheet: {
    create: (styles) => styles,
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 800, height: 1200 })),
  },
}));

// Mock @shopify/react-native-skia for node/Jest environment
jest.mock("@shopify/react-native-skia", () => {
  return {
    Skia: {
      PathBuilder: {
        Make: () => ({
          addRect: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          build: jest.fn(() => ({})),
        }),
      },
      Data: {
        fromBytes: (bytes) => ({ bytes }),
      },
      Image: {
        MakeImage: (info, data, rowBytes) => ({
          width: () => info.width,
          height: () => info.height,
          readPixels: () => data.bytes,
        }),
        MakeImageFromEncoded: (data) => ({
          width: () => 100,
          height: () => 100,
          readPixels: () => new Uint8Array(40000),
        }),
      },
      RuntimeEffect: {
        Make: jest.fn((sksl) => ({
          makeShader: jest.fn(),
          makeShaderWithChildren: jest.fn(),
          getUniformCount: () => 7,
          getUniformFloatCount: () => 7,
          source: () => sksl,
        })),
      },
      ColorFilter: {
        MakeMatrix: jest.fn((matrix) => ({ matrix })),
      },
    },
    Canvas: ({ children }) => children ?? null,
    Group: ({ children }) => children ?? null,
    Image: ({ children }) => children ?? null,
    Rect: ({ children }) => children ?? null,
    ColorMatrix: () => null,
    Shader: ({ children }) => children ?? null,
    ImageShader: () => null,
    useImage: () => ({ width: () => 800, height: () => 1000 }),
    AlphaType: { Unpremul: 1, Premul: 2 },
    ColorType: { RGBA_8888: 4 },
  };
});

// Mock expo-sqlite with in-memory map store
jest.mock("expo-sqlite", () => {
  const store = {
    projects: new Map(),
    appMetadata: new Map(),
    lessonProgress: new Map(),
    challengeCompletions: [],
    streak: { current_streak: 0, longest_streak: 0, last_active_date: null },
    drawingAnalyses: new Map(),
    generatedReferences: new Map(),
    savedPalettes: new Map(),
    strokeReplays: new Map(),
  };

  const mockDb = {
    execAsync: jest.fn(async (sql) => {}),
    runAsync: jest.fn(async (sql, ...params) => {
      if (sql.includes("INSERT INTO lesson_progress") || sql.includes("REPLACE INTO lesson_progress")) {
        store.lessonProgress.set(params[0], { lesson_id: params[0], completed: 1, completed_at: params[1] });
      } else if (sql.includes("DELETE FROM lesson_progress")) {
        store.lessonProgress.delete(params[0]);
      } else if (sql.includes("INSERT INTO challenge_completions")) {
        store.challengeCompletions.push({
          id: params[0],
          challenge_title: params[1],
          completed_date: params[2],
          completed_at: params[3],
          project_id: params[4],
        });
      } else if (sql.includes("UPDATE streak_data SET current_streak")) {
        if (params.length === 3) {
          store.streak.current_streak = params[0];
          store.streak.longest_streak = params[1];
          store.streak.last_active_date = params[2];
        } else {
          store.streak.current_streak = 0;
        }
      } else if (sql.includes("INSERT INTO drawing_analyses")) {
        store.drawingAnalyses.set(params[0], {
          id: params[0],
          project_id: params[1],
          timestamp: params[2],
          overall_score: params[3],
          proportions_score: params[4],
          alignment_score: params[5],
          perspective_score: params[6],
          composition_score: params[7],
          shading_score: params[8],
          feedback_json: params[9],
          annotations_json: params[10],
        });
      } else if (sql.includes("INSERT INTO generated_references")) {
        store.generatedReferences.set(params[0], {
          id: params[0],
          prompt: params[1],
          category: params[2],
          style: params[3],
          pose: params[4],
          lighting: params[5],
          uri: params[6],
          created_at: params[7],
        });
      } else if (sql.includes("DELETE FROM generated_references")) {
        store.generatedReferences.delete(params[0]);
      } else if (sql.includes("INSERT INTO saved_palettes")) {
        store.savedPalettes.set(params[0], {
          id: params[0],
          name: params[1],
          colors_json: params[2],
          created_at: params[3],
        });
      } else if (sql.includes("DELETE FROM saved_palettes")) {
        store.savedPalettes.delete(params[0]);
      } else if (sql.includes("INSERT INTO stroke_replays")) {
        store.strokeReplays.set(params[1], {
          id: params[0],
          project_id: params[1],
          events_json: params[2],
          duration_ms: params[3],
          created_at: params[4],
        });
      } else if (sql.includes("INTO projects")) {
        store.projects.set(params[0], {
          id: params[0],
          name: params[1],
          width: params[2],
          height: params[3],
          layers_json: params[4],
          active_layer_id: params[5],
          reference_uri: params[6],
          created_at: params[7],
          updated_at: params[8],
          paper_size: params[9],
          paper_orientation: params[10],
          paper_width_mm: params[11],
          paper_height_mm: params[12],
          paper_margin_mm: params[13],
          whiteout_level: params[14],
          image_brightness: params[15],
          image_contrast: params[16],
          overlays_json: params[17],
          adjustments_json: params[18],
          experience_mode: params[19],
        });
      } else if (sql.includes("DELETE FROM projects")) {
        store.projects.delete(params[0]);
      } else if (sql.includes("INSERT INTO app_metadata")) {
        // sql is: INSERT INTO app_metadata (key, value) VALUES ('onboarding_completed', ?) ...
        const match = sql.match(/VALUES \('([^']+)'/);
        const key = match ? match[1] : params[0];
        const val = match ? params[0] : params[1];
        store.appMetadata.set(key, val);
      } else if (sql.includes("DELETE FROM app_metadata")) {
        const match = sql.match(/key = '([^']+)'/);
        const key = match ? match[1] : params[0];
        store.appMetadata.delete(key);
      }
      return { changes: 1, lastInsertRowId: 1 };
    }),
    getAllAsync: jest.fn(async (sql, ...params) => {
      if (sql.includes("FROM lesson_progress")) {
        return Array.from(store.lessonProgress.values());
      }
      if (sql.includes("FROM challenge_completions")) {
        return store.challengeCompletions;
      }
      if (sql.includes("FROM drawing_analyses")) {
        const all = Array.from(store.drawingAnalyses.values());
        if (sql.includes("WHERE project_id = ?")) {
          return all.filter((a) => a.project_id === params[0]);
        }
        return all;
      }
      if (sql.includes("FROM generated_references")) {
        return Array.from(store.generatedReferences.values());
      }
      if (sql.includes("FROM saved_palettes")) {
        return Array.from(store.savedPalettes.values());
      }
      if (sql.includes("FROM projects")) {
        return Array.from(store.projects.values());
      }
      return [];
    }),
    getFirstAsync: jest.fn(async (sql, ...params) => {
      if (sql.includes("FROM projects")) {
        return store.projects.get(params[0]) ?? null;
      }
      if (sql.includes("FROM streak_data")) {
        return { ...store.streak };
      }
      if (sql.includes("FROM stroke_replays")) {
        return store.strokeReplays.get(params[0]) ?? null;
      }
      if (sql.includes("FROM app_metadata")) {
        const match = sql.match(/key = '([^']+)'/);
        const key = match ? match[1] : params[0];
        const val = store.appMetadata.get(key);
        return val ? { value: val } : null;
      }
      return null;
    }),
  };

  return {
    openDatabaseAsync: jest.fn(async () => mockDb),
  };
});

// Mock expo-file-system and expo-file-system/legacy
const fileSystemMock = {
  documentDirectory: "file:///mock/documents/",
  cacheDirectory: "file:///mock/cache/",
  writeAsStringAsync: jest.fn(async () => {}),
  readAsStringAsync: jest.fn(async () => ""),
  getInfoAsync: jest.fn(async () => ({ exists: true })),
  makeDirectoryAsync: jest.fn(async () => {}),
  downloadAsync: jest.fn(async () => ({ uri: "file:///mock/downloaded.jpg" })),
  copyAsync: jest.fn(async () => {}),
};

jest.mock("expo-file-system/legacy", () => fileSystemMock);
jest.mock("expo-file-system", () => fileSystemMock);

// Mock expo-image-manipulator
jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(async (uri) => ({
    uri: "file:///mock/manipulated.png",
    width: 800,
    height: 1000,
  })),
  SaveFormat: { PNG: "png", JPEG: "jpeg" },
}));
