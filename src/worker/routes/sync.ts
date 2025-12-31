import { Hono } from 'hono';
import type { Env } from '../types';

const sync = new Hono<{ Bindings: Env }>();

// Create sync event when file is uploaded
sync.post('/events', async (c) => {
  try {
    const { fileId, eventType, sourceLocation, metadata } = await c.req.json();

    if (!fileId || !eventType || !sourceLocation) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create sync event
    const result = await c.env.DB.prepare(
      `INSERT INTO file_sync_events (file_id, event_type, source_location, sync_status, metadata)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      fileId,
      eventType,
      sourceLocation,
      'pending',
      metadata ? JSON.stringify(metadata) : null
    ).run();

    // Get file details
    const fileRecord = await c.env.DB.prepare(
      `SELECT * FROM files WHERE id = ?`
    ).bind(fileId).first();

    if (!fileRecord) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Create sync targets for all drop zones
    const syncTargets = [
      { type: 'admin_panel', id: 'hotstack-admin' },
      { type: 'drop_zone', id: 'hotstack-dropzone' },
      { type: 'cart', id: 'shopping-cart' },
      { type: 'vaultmesh', id: 'snapshots' },
      { type: 'file_manager', id: 'home-files' }
    ];

    for (const target of syncTargets) {
      await c.env.DB.prepare(
        `INSERT INTO sync_targets (file_id, target_type, target_id, sync_complete, sync_data)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        fileId,
        target.type,
        target.id,
        sourceLocation === target.type ? 1 : 0, // Mark source as already synced
        JSON.stringify({
          fileName: fileRecord.name,
          fileSize: fileRecord.size,
          mimeType: fileRecord.mime_type,
          storageKey: fileRecord.storage_key
        })
      ).run();
    }

    // Update event status
    await c.env.DB.prepare(
      `UPDATE file_sync_events SET sync_status = ? WHERE id = ?`
    ).bind('syncing', result.meta.last_row_id).run();

    return c.json({
      success: true,
      eventId: result.meta.last_row_id,
      fileId,
      syncTargets: syncTargets.length,
      message: 'Sync initiated across all drop zones'
    });
  } catch (error) {
    console.error('Sync event error:', error);
    return c.json({ error: 'Failed to create sync event' }, 500);
  }
});

// Get pending sync events
sync.get('/events/pending', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT se.*, f.name as file_name, f.size as file_size, f.mime_type
       FROM file_sync_events se
       JOIN files f ON se.file_id = f.id
       WHERE se.sync_status IN ('pending', 'syncing')
       ORDER BY se.created_at DESC
       LIMIT 100`
    ).all();

    return c.json({
      events: result.results || [],
      count: (result.results || []).length
    });
  } catch (error) {
    console.error('Get pending events error:', error);
    return c.json({ error: 'Failed to get pending events' }, 500);
  }
});

// Get sync status for a file
sync.get('/status/:fileId', async (c) => {
  try {
    const fileId = c.req.param('fileId');

    // Get sync event
    const eventResult = await c.env.DB.prepare(
      `SELECT * FROM file_sync_events WHERE file_id = ? ORDER BY created_at DESC LIMIT 1`
    ).bind(fileId).first();

    // Get sync targets
    const targetsResult = await c.env.DB.prepare(
      `SELECT * FROM sync_targets WHERE file_id = ?`
    ).bind(fileId).all();

    const targets = targetsResult.results || [];
    const completedTargets = targets.filter((t: any) => t.sync_complete);

    return c.json({
      fileId,
      event: eventResult,
      targets: targets.map((t: any) => ({
        ...t,
        sync_data: t.sync_data ? JSON.parse(t.sync_data) : null
      })),
      progress: {
        total: targets.length,
        completed: completedTargets.length,
        percentage: targets.length > 0 ? Math.round((completedTargets.length / targets.length) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    return c.json({ error: 'Failed to get sync status' }, 500);
  }
});

// Mark sync target as complete
sync.post('/targets/:id/complete', async (c) => {
  try {
    const targetId = c.req.param('id');
    const { additionalData } = await c.req.json();

    await c.env.DB.prepare(
      `UPDATE sync_targets SET sync_complete = 1, sync_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(
      additionalData ? JSON.stringify(additionalData) : null,
      targetId
    ).run();

    // Check if all targets are complete
    const target = await c.env.DB.prepare(
      `SELECT file_id FROM sync_targets WHERE id = ?`
    ).bind(targetId).first();

    if (target) {
      const allTargets = await c.env.DB.prepare(
        `SELECT COUNT(*) as total, SUM(CASE WHEN sync_complete = 1 THEN 1 ELSE 0 END) as completed
         FROM sync_targets WHERE file_id = ?`
      ).bind(target.file_id).first();

      if (allTargets && allTargets.total === allTargets.completed) {
        // All targets synced - update event status
        await c.env.DB.prepare(
          `UPDATE file_sync_events SET sync_status = 'completed', updated_at = CURRENT_TIMESTAMP 
           WHERE file_id = ? AND sync_status != 'completed'`
        ).bind(target.file_id).run();
      }
    }

    return c.json({ success: true, message: 'Sync target marked complete' });
  } catch (error) {
    console.error('Complete sync target error:', error);
    return c.json({ error: 'Failed to complete sync target' }, 500);
  }
});

// Get all recent syncs
sync.get('/recent', async (c) => {
  try {
    const hours = parseInt(c.req.query('hours') || '24');

    const result = await c.env.DB.prepare(
      `SELECT se.*, f.name as file_name, f.size as file_size, f.mime_type,
              COUNT(st.id) as total_targets,
              SUM(CASE WHEN st.sync_complete = 1 THEN 1 ELSE 0 END) as completed_targets
       FROM file_sync_events se
       JOIN files f ON se.file_id = f.id
       LEFT JOIN sync_targets st ON se.file_id = st.file_id
       WHERE se.created_at > datetime('now', '-${hours} hours')
       GROUP BY se.id
       ORDER BY se.created_at DESC
       LIMIT 50`
    ).all();

    return c.json({
      syncs: (result.results || []).map((s: any) => ({
        ...s,
        metadata: s.metadata ? JSON.parse(s.metadata) : null,
        progress: s.total_targets > 0 
          ? Math.round((s.completed_targets / s.total_targets) * 100)
          : 0
      })),
      timeRange: `${hours} hours`
    });
  } catch (error) {
    console.error('Get recent syncs error:', error);
    return c.json({ error: 'Failed to get recent syncs' }, 500);
  }
});

// Sync health check
sync.get('/health', async (c) => {
  try {
    // Count pending, syncing, and completed events
    const stats = await c.env.DB.prepare(
      `SELECT 
        sync_status,
        COUNT(*) as count,
        AVG(JULIANDAY('now') - JULIANDAY(created_at)) * 24 * 60 as avg_age_minutes
       FROM file_sync_events
       WHERE created_at > datetime('now', '-24 hours')
       GROUP BY sync_status`
    ).all();

    // Count sync targets
    const targetStats = await c.env.DB.prepare(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN sync_complete = 1 THEN 1 ELSE 0 END) as completed
       FROM sync_targets
       WHERE created_at > datetime('now', '-24 hours')`
    ).first();

    const syncRate = targetStats && Number(targetStats.total) > 0
      ? Math.round((Number(targetStats.completed) / Number(targetStats.total)) * 100)
      : 100;

    return c.json({
      status: 'healthy',
      stats: (stats.results || []).map((s: any) => ({
        status: s.sync_status,
        count: s.count,
        avgAgeMinutes: Math.round(s.avg_age_minutes || 0)
      })),
      targets: {
        total: targetStats?.total || 0,
        completed: targetStats?.completed || 0,
        syncRate: syncRate
      },
      health: syncRate >= 90 ? 'excellent' : syncRate >= 70 ? 'good' : 'needs attention'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({ error: 'Failed to get health status' }, 500);
  }
});

// Retry failed syncs
sync.post('/retry/:fileId', async (c) => {
  try {
    const fileId = c.req.param('fileId');

    // Reset sync event to pending
    await c.env.DB.prepare(
      `UPDATE file_sync_events SET sync_status = 'pending', updated_at = CURRENT_TIMESTAMP 
       WHERE file_id = ? AND sync_status = 'failed'`
    ).bind(fileId).run();

    // Reset incomplete sync targets
    await c.env.DB.prepare(
      `UPDATE sync_targets SET sync_complete = 0, updated_at = CURRENT_TIMESTAMP 
       WHERE file_id = ? AND sync_complete = 0`
    ).bind(fileId).run();

    return c.json({
      success: true,
      message: 'Sync retry initiated',
      fileId
    });
  } catch (error) {
    console.error('Retry sync error:', error);
    return c.json({ error: 'Failed to retry sync' }, 500);
  }
});

export default sync;
