-- marketplace_brands: canonical brand registry seeded from v3.4 export
CREATE TABLE IF NOT EXISTS marketplace_brands (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL DEFAULT '🌐',
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Building',
  tone INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brands_status ON marketplace_brands(status);
CREATE INDEX IF NOT EXISTS idx_brands_sort ON marketplace_brands(sort_order);

-- Seed: 16 brands from marketplace-registry.json (v3.4.1 export 2026-10-22)
INSERT OR IGNORE INTO marketplace_brands (id, icon, name, sector, description, status, tone, sort_order, is_published) VALUES
  ('3781fadf-1d46-4d6d-8ad4-b633c30a1158', '🏛️', 'FAA™ ADVANCED ALGORITHM™',      'Legal · Compliance',      'Registered trademark · Atom-Level Verification™ · Global IP active',                       'Live',     1,  10, 1),
  ('34be3868-5a5f-41ae-a387-12586ed84ceb', '🌐', 'FAA.ZONE™',                       'Tech · Platform',         'Ecosystem hub · 120 brands · 6+ continents · Real-time data',                             'Live',     2,  20, 1),
  ('751fcc5b-7823-4f7e-a4ef-3717a4b33b0f', '🔥', 'HOTSTACK™',                       'Build · Deploy',          'Vibe Builder · 20 templates · Hercules infrastructure · FAA.ZONE data',                  'Live',     3,  30, 1),
  ('0ecd2e24-181d-4f7d-af66-90209f27b5a2', '🌱', 'CRATE DANCE SHOWCASE™',           'Impact · Youth',          'Global street dance movement · Red Bull · R391M revenue target',                          'Building', 4,  40, 1),
  ('e382435c-f514-42ce-bfaa-b42c6e966b7e', '🏺', 'SEKELBOS TANK™',                  'Commerce · Artisan',      'Artisan marketplace · 20% commission · Franchise-ready · Global',                        'Live',     5,  50, 1),
  ('df0b43a3-4037-46bc-bb7b-dddcacc64b43', '🔒', 'VAULTMESH™',                      'Security · Vault',        '9-second pulse engine · SHA-256 integrity · Blockchain audit trail',                     'Live',     6,  60, 1),
  ('fd06ea1f-c175-43a2-af6d-d96c0ae04a5f', '📜', 'LICENSEVAULT',                    'Licensing · IP',          '13,713 brands verified · FAA™ + HSOMNI9000 + Seedwave',                                 'Live',     7,  70, 1),
  ('863bfb95-5ff1-4c61-9081-acca080d6bce', '🔗', 'SEEDWAVECONNECT',                 'Sync · Integration',      'PulseGlow™ 9s heartbeat · CodeNest sync · BuildNest deploy',                             'Live',     8,  80, 1),
  ('eaa783dd-c1ac-47b4-a4d6-a115c40a1624', '🌍', 'FRUITFUL PLANET CHANGE™',         'Impact · Planet',         'Social enterprise · Ubuntu commerce · Poverty & inequality focus',                       'Live',     9,  90, 1),
  ('662495b4-6fe2-4b7c-83bd-01d2e7a6f019', '🧩', 'CODENEST',                        'Meta · Orchestration',    '93 repos · Central orchestrator · Ecosystem sync hub · BuildNest',                      'Live',     10, 100, 1),
  ('5de1f012-b7cc-4760-9570-d20a951ea20b', '🌳', 'BUSH PORTAL™',                    'Hospitality · Bush',      'Self-service artisan kiosk · Pancakes · Baobab Terminal · App build',                   'Live',     11, 110, 1),
  ('a1b2c3d4-0001-0001-0001-000000000001', '🐾', 'BANIMAL LOOP™',                   'Impact · Creatures',      'Ethical creature data synthesis · Baobab Network integration · Ubuntu commerce',        'Building', 12, 120, 1),
  ('a1b2c3d4-0001-0001-0001-000000000002', '🌾', 'AGROCHAIN™',                      'Agriculture · Biotech',   'FAA.zone framework · Advanced automation · Data management · Food chain',               'Building', 13, 130, 1),
  ('a1b2c3d4-0001-0001-0001-000000000003', '💳', 'FRUITFUL PAY™',                   'Commerce · Payments',     'Multi-provider gateway · Paystack · Stripe · PayFast · Crypto.com',                     'Building', 14, 140, 1),
  ('a1b2c3d4-0001-0001-0001-000000000004', '🏗️', 'BUILDNEST™',                      'Build · CI/CD',           'Turbo monorepo engine · CodeNest orchestration · Vercel deploy pipeline',               'Building', 15, 150, 1),
  ('a1b2c3d4-0001-0001-0001-000000000005', '🌊', 'SEEDWAVE™',                       'Platform · Signal',       'Fruitful signal protocol · 9-second VaultMesh pulse · Genesis SEEDWAVE-011',            'Live',     16, 160, 1);
