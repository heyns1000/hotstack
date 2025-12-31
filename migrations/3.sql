
CREATE TABLE mocha_webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT,
  app_id TEXT,
  payload TEXT,
  processed BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mocha_webhook_events_app_id ON mocha_webhook_events(app_id);
CREATE INDEX idx_mocha_webhook_events_created_at ON mocha_webhook_events(created_at DESC);
