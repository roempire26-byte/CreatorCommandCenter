CREATE TABLE vods (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  status TEXT NOT NULL,
  transcript TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE clip_candidates (
  id TEXT PRIMARY KEY,
  vod_id TEXT NOT NULL REFERENCES vods(id),
  start_seconds INTEGER NOT NULL,
  end_seconds INTEGER NOT NULL,
  title TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_clip_candidates_vod ON clip_candidates(vod_id);
