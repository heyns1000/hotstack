import { useState, useEffect, useCallback } from 'react';

type Tab = 'files' | 'snapshots' | 'folders';

interface VaultFile {
  id: string; name: string; size: number; uploadedAt: string; mimeType?: string;
}
interface Snapshot {
  id: string; name: string; fileCount: number; createdAt: string; sizeBytes: number;
}
interface VaultFolder {
  id: string; name: string; path: string; fileCount: number;
}
interface SyncHealth {
  status: 'ok' | 'degraded' | 'error'; queueDepth: number; lastSync: string; successRate: number;
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(s: string) {
  try { return new Date(s).toLocaleString(); } catch { return s; }
}

export default function VaultDashboard() {
  const [tab, setTab] = useState<Tab>('files');
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [health, setHealth] = useState<SyncHealth | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const r = await fetch('/api/files');
      if (r.ok) setFiles(await r.json());
    } catch { /* swallow */ }
  }, []);

  const fetchSnapshots = useCallback(async () => {
    try {
      const r = await fetch('/api/vaultmesh/snapshots');
      if (r.ok) setSnapshots(await r.json());
    } catch { /* swallow */ }
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      const r = await fetch('/api/vaultmesh/folders');
      if (r.ok) setFolders(await r.json());
    } catch { /* swallow */ }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const r = await fetch('/api/sync/health');
      if (r.ok) setHealth(await r.json());
    } catch { /* swallow */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchFiles(), fetchSnapshots(), fetchFolders(), fetchHealth()])
      .finally(() => setLoading(false));
    const id = setInterval(fetchHealth, 5000);
    return () => clearInterval(id);
  }, [fetchFiles, fetchSnapshots, fetchFolders, fetchHealth]);

  useEffect(() => {
    if (tab === 'files') fetchFiles();
    else if (tab === 'snapshots') fetchSnapshots();
    else fetchFolders();
  }, [tab, fetchFiles, fetchSnapshots, fetchFolders]);

  const healthColor = health
    ? health.status === 'ok' ? 'var(--teal)'
    : health.status === 'degraded' ? 'var(--yellow)'
    : 'var(--pink)'
    : 'var(--text-muted)';

  const TABS: { key: Tab; label: string }[] = [
    { key: 'files', label: 'All Files' },
    { key: 'snapshots', label: 'Snapshots' },
    { key: 'folders', label: 'Folders' },
  ];

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            VAULTMESH™ L7 · R2 hotstack-intake-bucket
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--text-primary)', margin: 0 }}>
            Vault Dashboard
          </h1>
        </div>

        {/* Sync health widget */}
        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '0.9rem 1.25rem', minWidth: 200,
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
            Sync Health · 5s pulse
          </div>
          {health ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: healthColor, display: 'inline-block' }} />
                <span style={{ color: healthColor, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {health.status}
                </span>
              </div>
              <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Queue: <span style={{ color: 'var(--yellow)' }}>{health.queueDepth}</span>&nbsp;·&nbsp;
                Success: <span style={{ color: 'var(--teal)' }}>{(health.successRate * 100).toFixed(1)}%</span>
              </div>
              <div style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                Last: {fmtDate(health.lastSync)}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>polling…</span>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.6rem 1.25rem',
              background: 'transparent', border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--teal)' : '2px solid transparent',
              color: tab === t.key ? 'var(--teal)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Loading…</p>
      )}

      {/* Files */}
      {tab === 'files' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {files.length === 0 && !loading && (
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No files found in vault.</p>
          )}
          {files.map(f => (
            <div key={f.id} style={{
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.85rem 1.1rem',
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            }}>
              <span style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', flexShrink: 0 }}>
                {f.mimeType?.startsWith('image/') ? '🖼' : '📄'}
              </span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', flexShrink: 0 }}>
                {fmtBytes(f.size)}
              </span>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', flexShrink: 0 }}>
                {fmtDate(f.uploadedAt)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Snapshots */}
      {tab === 'snapshots' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {snapshots.length === 0 && !loading && (
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No snapshots found.</p>
          )}
          {snapshots.map(s => (
            <div key={s.id} style={{
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '1.1rem',
            }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {s.name}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span>{s.fileCount} files · {fmtBytes(s.sizeBytes)}</span>
                <span style={{ color: 'var(--text-muted)' }}>{fmtDate(s.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Folders */}
      {tab === 'folders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {folders.length === 0 && !loading && (
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No folders found.</p>
          )}
          {folders.map(f => (
            <div key={f.id} style={{
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.85rem 1.1rem',
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            }}>
              <span style={{ color: 'var(--yellow)', fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>📁</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', fontSize: '0.9rem', flex: 1 }}>
                {f.name}
              </span>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                {f.path}
              </span>
              <span style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', flexShrink: 0 }}>
                {f.fileCount} files
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
