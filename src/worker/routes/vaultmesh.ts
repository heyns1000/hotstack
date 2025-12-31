import { Hono } from 'hono';
import type { Env } from '../types';

const vaultmesh = new Hono<{ Bindings: Env }>();

// Add file to VaultMesh folder
vaultmesh.post('/add', async (c) => {
  try {
    const { file_id, user_id, folder_name, is_snapshot } = await c.req.json();

    const result = await c.env.DB.prepare(
      `INSERT INTO vaultmesh_folders (user_id, file_id, folder_name, is_snapshot)
       VALUES (?, ?, ?, ?)`
    ).bind(
      user_id || 'root',
      file_id,
      folder_name || 'default',
      is_snapshot ? 1 : 0
    ).run();

    return c.json({ 
      success: true, 
      id: result.meta.last_row_id 
    });
  } catch (error) {
    console.error('VaultMesh add error:', error);
    return c.json({ 
      error: 'Failed to add file to VaultMesh',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get files in VaultMesh folder
vaultmesh.get('/files', async (c) => {
  try {
    const user_id = c.req.query('user_id') || 'root';
    const folder_name = c.req.query('folder_name') || 'default';
    const limit = parseInt(c.req.query('limit') || '50');

    const result = await c.env.DB.prepare(
      `SELECT 
        vaultmesh_folders.*,
        files.name,
        files.size,
        files.mime_type,
        files.storage_key
       FROM vaultmesh_folders
       JOIN files ON vaultmesh_folders.file_id = files.id
       WHERE vaultmesh_folders.user_id = ? AND vaultmesh_folders.folder_name = ?
       ORDER BY vaultmesh_folders.created_at DESC
       LIMIT ?`
    ).bind(user_id, folder_name, limit).all();

    return c.json({
      files: result.results || [],
      user_id,
      folder_name
    });
  } catch (error) {
    console.error('VaultMesh files error:', error);
    return c.json({ 
      error: 'Failed to fetch VaultMesh files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get all folders for user
vaultmesh.get('/folders', async (c) => {
  try {
    const user_id = c.req.query('user_id') || 'root';

    const result = await c.env.DB.prepare(
      `SELECT 
        folder_name,
        COUNT(*) as file_count,
        MAX(created_at) as last_updated
       FROM vaultmesh_folders
       WHERE user_id = ?
       GROUP BY folder_name
       ORDER BY last_updated DESC`
    ).bind(user_id).all();

    return c.json({
      folders: result.results || [],
      user_id
    });
  } catch (error) {
    console.error('VaultMesh folders error:', error);
    return c.json({ 
      error: 'Failed to fetch VaultMesh folders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get snapshots (recent uploads)
vaultmesh.get('/snapshots', async (c) => {
  try {
    const user_id = c.req.query('user_id') || 'root';
    const limit = parseInt(c.req.query('limit') || '10');

    const result = await c.env.DB.prepare(
      `SELECT 
        vaultmesh_folders.*,
        files.name,
        files.size,
        files.mime_type,
        files.storage_key
       FROM vaultmesh_folders
       JOIN files ON vaultmesh_folders.file_id = files.id
       WHERE vaultmesh_folders.user_id = ? AND vaultmesh_folders.is_snapshot = 1
       ORDER BY vaultmesh_folders.created_at DESC
       LIMIT ?`
    ).bind(user_id, limit).all();

    return c.json({
      snapshots: result.results || [],
      user_id
    });
  } catch (error) {
    console.error('VaultMesh snapshots error:', error);
    return c.json({ 
      error: 'Failed to fetch VaultMesh snapshots',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Remove file from VaultMesh
vaultmesh.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    await c.env.DB.prepare(
      `DELETE FROM vaultmesh_folders WHERE id = ?`
    ).bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('VaultMesh delete error:', error);
    return c.json({ 
      error: 'Failed to remove file from VaultMesh',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default vaultmesh;
