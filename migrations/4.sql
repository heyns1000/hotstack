
CREATE TABLE vaultmesh_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  file_id INTEGER,
  folder_name TEXT DEFAULT 'default',
  is_snapshot BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vaultmesh_folders_user_id ON vaultmesh_folders(user_id);
CREATE INDEX idx_vaultmesh_folders_file_id ON vaultmesh_folders(file_id);
CREATE INDEX idx_vaultmesh_folders_created_at ON vaultmesh_folders(created_at DESC);
