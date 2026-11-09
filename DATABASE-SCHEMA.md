# ARTISTRY AI — Database Schema Specification

This document defines the schema architecture for both the **Local SQLite Database** (on-device offline storage) and the **Cloud MongoDB Database** (remote persistence, user sync, and platform features).

---

## 1. Local SQLite Database Schema (`artistry-ai.db`)

Engineered with `expo-sqlite` utilizing Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and Foreign Key enforcement (`PRAGMA foreign_keys = ON;`).

```sql
-- Projects Table: Stores all user drawings, canvas dimensions, serialized vector layers, and reference links.
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  layers_json TEXT NOT NULL,          -- Serialized DrawingLayer[] with strokes and points
  active_layer_id TEXT NOT NULL,
  reference_uri TEXT,                  -- Optional file:// URI to local reference image
  thumbnail_uri TEXT,                  -- Cached small preview image
  tags TEXT,                           -- Comma-separated or JSON array of tags
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Local References Table: Tracks imported user photos and their non-destructive working copies.
CREATE TABLE IF NOT EXISTS references_local (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  uri TEXT NOT NULL,                   -- file:// URI to current working copy
  original_uri TEXT NOT NULL,          -- file:// URI to untouched source copy
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  is_edited INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- Daily Challenges Table: Local cache of daily drawing prompts, user submissions, and streaks.
CREATE TABLE IF NOT EXISTS daily_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  date_string TEXT UNIQUE NOT NULL,    -- Format: YYYY-MM-DD
  title_en TEXT NOT NULL,
  title_ta TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  prompt_ta TEXT NOT NULL,
  difficulty TEXT NOT NULL,            -- 'beginner' | 'intermediate' | 'advanced'
  reference_asset_uri TEXT,
  completed_project_id TEXT,           -- Foreign reference to completed project
  completed_at INTEGER,
  time_spent_seconds INTEGER DEFAULT 0
);

-- User Preferences & App Metadata: Stores active reference pointer, language, theme, and subscription cache.
CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

-- Indexes for high-performance sorting and query operations
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_date ON daily_challenges (date_string DESC);
```

### JSON Data Structures Stored in SQLite

#### `layers_json` Field (DrawingLayer Array):
```json
[
  {
    "id": "layer-1",
    "name": "Line Art",
    "visible": true,
    "opacity": 1.0,
    "blendMode": "srcOver",
    "strokes": [
      {
        "id": "stroke-101",
        "kind": "pencil",
        "color": "#1C211D",
        "width": 4.5,
        "points": [
          { "x": 120.5, "y": 240.2, "pressure": 0.8 },
          { "x": 125.0, "y": 248.6, "pressure": 0.85 }
        ]
      }
    ]
  }
]
```

---

## 2. Cloud MongoDB Database Schema

Engineered with Mongoose schemas for the Node.js Express backend.

### 2.1 Collection: `users`
```typescript
interface IUser {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  role: 'user' | 'artist_pro' | 'admin';
  preferredLanguage: 'en' | 'ta';
  subscription: {
    tier: 'free' | 'pro' | 'studio';
    status: 'active' | 'expired' | 'canceled';
    validUntil?: Date;
    playOrderId?: string;
  };
  stats: {
    projectsCreated: number;
    challengesCompleted: number;
    currentStreakDays: number;
    longestStreakDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Collection: `cloud_projects`
```typescript
interface ICloudProject {
  _id: ObjectId;
  userId: ObjectId;
  clientProjectId: string;             // SQLite project UUID
  name: string;
  width: number;
  height: number;
  layersCompressed: Buffer;            // Gzip/Brotli compressed JSON string
  thumbnailUrl?: string;
  tags: string[];
  isPublic: boolean;
  version: number;
  syncedAt: Date;
}
```

### 2.3 Collection: `reference_library`
```typescript
interface IReferenceLibraryItem {
  _id: ObjectId;
  category: 'portraits' | 'anatomy' | 'animals' | 'landscapes' | 'master_studies';
  title_en: string;
  title_ta: string;
  description_en: string;
  description_ta: string;
  imageUrl: string;
  thumbnailUrl: string;
  aspectRatio: number;
  tags: string[];
  suggestedTools: ('loomis' | 'tracing' | 'shading' | 'grid')[];
  license: 'public_domain' | 'cc0' | 'licensed';
  isFeatured: boolean;
  createdAt: Date;
}
```

### 2.4 Collection: `daily_challenges`
```typescript
interface IDailyChallenge {
  _id: ObjectId;
  date: string;                        // YYYY-MM-DD
  title_en: string;
  title_ta: string;
  prompt_en: string;
  prompt_ta: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  referenceImageId?: ObjectId;
  timeLimitMinutes?: number;
  active: boolean;
}
```

### 2.5 Collection: `admin_audit_logs`
```typescript
interface IAdminAuditLog {
  _id: ObjectId;
  adminUserId: ObjectId;
  action: string;                      // e.g. 'UPDATE_USER_TIER', 'PUBLISH_CHALLENGE'
  targetId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
}
```

---

*Last Updated: 2026-11-04*
