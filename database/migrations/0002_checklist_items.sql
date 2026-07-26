CREATE TABLE checklist_items (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE INDEX idx_checklist_items_sort_order ON checklist_items(sort_order);
