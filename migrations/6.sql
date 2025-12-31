
CREATE TABLE file_sync_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER,
  event_type TEXT,
  source_location TEXT,
  sync_status TEXT DEFAULT 'pending',
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_file ON file_sync_events(file_id);
CREATE INDEX idx_sync_status ON file_sync_events(sync_status);

CREATE TABLE sync_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER,
  target_type TEXT,
  target_id TEXT,
  sync_complete BOOLEAN DEFAULT 0,
  sync_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_targets_file ON sync_targets(file_id);
CREATE INDEX idx_sync_targets_complete ON sync_targets(sync_complete);
