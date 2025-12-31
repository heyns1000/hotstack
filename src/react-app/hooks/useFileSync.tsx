import { useState, useEffect, useCallback } from 'react';

interface SyncEvent {
  id: number;
  file_id: number;
  event_type: string;
  source_location: string;
  sync_status: string;
  metadata: any;
  created_at: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

interface SyncProgress {
  total: number;
  completed: number;
  percentage: number;
}

interface FileSyncStatus {
  fileId: number;
  event: SyncEvent | null;
  targets: any[];
  progress: SyncProgress;
}

export function useFileSync(fileId?: number, autoRefresh = false) {
  const [syncStatus, setSyncStatus] = useState<FileSyncStatus | null>(null);
  const [recentSyncs, setRecentSyncs] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStatus = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sync/status/${id}`);
      if (!response.ok) throw new Error('Failed to fetch sync status');

      const data = await response.json();
      setSyncStatus(data);
    } catch (err) {
      console.error('Fetch sync status error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentSyncs = useCallback(async (hours = 24) => {
    try {
      const response = await fetch(`/api/sync/recent?hours=${hours}`);
      if (!response.ok) throw new Error('Failed to fetch recent syncs');

      const data = await response.json();
      setRecentSyncs(data.syncs || []);
    } catch (err) {
      console.error('Fetch recent syncs error:', err);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/sync/health');
      if (!response.ok) throw new Error('Failed to fetch sync health');

      const data = await response.json();
      setHealth(data);
    } catch (err) {
      console.error('Fetch sync health error:', err);
    }
  }, []);

  const createSyncEvent = useCallback(async (
    fileId: number,
    eventType: string,
    sourceLocation: string,
    metadata?: any
  ) => {
    try {
      const response = await fetch('/api/sync/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          eventType,
          sourceLocation,
          metadata
        })
      });

      if (!response.ok) throw new Error('Failed to create sync event');

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Create sync event error:', err);
      throw err;
    }
  }, []);

  const markTargetComplete = useCallback(async (targetId: number, additionalData?: any) => {
    try {
      const response = await fetch(`/api/sync/targets/${targetId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalData })
      });

      if (!response.ok) throw new Error('Failed to mark target complete');

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Mark target complete error:', err);
      throw err;
    }
  }, []);

  const retrySync = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/sync/retry/${id}`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to retry sync');

      const data = await response.json();
      
      // Refresh status after retry
      if (fileId) {
        await fetchSyncStatus(fileId);
      }
      
      return data;
    } catch (err) {
      console.error('Retry sync error:', err);
      throw err;
    }
  }, [fileId, fetchSyncStatus]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (autoRefresh && fileId) {
      fetchSyncStatus(fileId);
      const interval = setInterval(() => {
        fetchSyncStatus(fileId);
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [fileId, autoRefresh, fetchSyncStatus]);

  // Initial fetch
  useEffect(() => {
    if (fileId && !autoRefresh) {
      fetchSyncStatus(fileId);
    }
  }, [fileId, autoRefresh, fetchSyncStatus]);

  return {
    syncStatus,
    recentSyncs,
    health,
    loading,
    error,
    fetchSyncStatus,
    fetchRecentSyncs,
    fetchHealth,
    createSyncEvent,
    markTargetComplete,
    retrySync
  };
}
