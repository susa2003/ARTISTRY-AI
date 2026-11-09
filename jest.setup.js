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
    },
    AlphaType: { Unpremul: 1, Premul: 2 },
    ColorType: { RGBA_8888: 4 },
  };
});

// Mock expo-sqlite with in-memory map store
jest.mock("expo-sqlite", () => {
  const store = {
    projects: new Map(),
    lessonProgress: new Map(),
    challengeCompletions: [],
    streak: { current_streak: 0, longest_streak: 0, last_active_date: null },
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
      }
      return { changes: 1, lastInsertRowId: 1 };
    }),
    getAllAsync: jest.fn(async (sql) => {
      if (sql.includes("FROM lesson_progress")) {
        return Array.from(store.lessonProgress.values());
      }
      if (sql.includes("FROM challenge_completions")) {
        return store.challengeCompletions;
      }
      return [];
    }),
    getFirstAsync: jest.fn(async (sql) => {
      if (sql.includes("FROM streak_data")) {
        return { ...store.streak };
      }
      return null;
    }),
  };

  return {
    openDatabaseAsync: jest.fn(async () => mockDb),
  };
});
