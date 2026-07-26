CREATE TABLE stream_sessions (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER
);

CREATE TABLE metric_snapshots (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value REAL NOT NULL,
  session_id TEXT REFERENCES stream_sessions(id)
);

CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  metric TEXT NOT NULL,
  label TEXT NOT NULL,
  target REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  period TEXT NOT NULL,
  current_value REAL NOT NULL DEFAULT 0
);

CREATE TABLE content_items (
  id TEXT PRIMARY KEY,
  source_session_id TEXT REFERENCES stream_sessions(id),
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  draft TEXT,
  due_at TEXT
);

CREATE TABLE automation_runs (
  id TEXT PRIMARY KEY,
  workflow TEXT NOT NULL,
  status TEXT NOT NULL,
  initiated_by TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  result TEXT
);

CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  detail TEXT,
  correlation_id TEXT
);

CREATE INDEX idx_metric_snapshots_session ON metric_snapshots(session_id);
CREATE INDEX idx_content_items_session ON content_items(source_session_id);
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp);
