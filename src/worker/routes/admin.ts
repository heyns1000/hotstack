import { Hono } from 'hono';
import { verifyPassword, generateSessionToken, generateExpiryDate } from '../lib/auth';
import { adminAuthMiddleware, logActivity } from '../middleware/admin-auth';
import type { Env } from '../types';

type AdminUser = {
  id: number;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
};

type AdminEnv = {
  Bindings: Env;
  Variables: {
    adminUser: AdminUser;
  };
};

const admin = new Hono<AdminEnv>();

// Login endpoint
admin.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  // Get admin user
  const user = await c.env.DB.prepare(
    `SELECT id, email, password_hash, full_name, is_super_admin FROM admin_users WHERE email = ?`
  )
    .bind(email)
    .first();

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Verify password
  const validPassword = await verifyPassword(password, user.password_hash as string);
  if (!validPassword) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Create session
  const sessionToken = generateSessionToken();
  const expiresAt = generateExpiryDate(7);
  const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For');
  const userAgent = c.req.header('User-Agent');

  await c.env.DB.prepare(
    `INSERT INTO admin_sessions (admin_user_id, session_token, expires_at, ip_address, user_agent) 
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(user.id, sessionToken, expiresAt, ipAddress, userAgent)
    .run();

  // Update last login
  await c.env.DB.prepare(
    `UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?`
  )
    .bind(user.id)
    .run();

  // Log activity
  await c.env.DB.prepare(
    `INSERT INTO activity_logs (admin_user_id, action, ip_address) VALUES (?, ?, ?)`
  )
    .bind(user.id, 'admin_login', ipAddress)
    .run();

  return c.json({
    token: sessionToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      isSuperAdmin: user.is_super_admin === 1,
    },
  });
});

// Logout endpoint
admin.post('/logout', adminAuthMiddleware, async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.substring(7);

  if (token) {
    await c.env.DB.prepare(`DELETE FROM admin_sessions WHERE session_token = ?`)
      .bind(token)
      .run();
  }

  await logActivity(c, 'admin_logout');

  return c.json({ success: true });
});

// Get current user
admin.get('/me', adminAuthMiddleware, async (c) => {
  const adminUser = c.get('adminUser');
  return c.json(adminUser);
});

// Dashboard stats
admin.get('/stats', adminAuthMiddleware, async (c) => {
  const [filesCount, totalSize, recentUploads, topMimeTypes] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as count FROM files`).first(),
    c.env.DB.prepare(`SELECT SUM(size) as total FROM files`).first(),
    c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM files WHERE created_at > datetime('now', '-24 hours')`
    ).first(),
    c.env.DB.prepare(
      `SELECT mime_type, COUNT(*) as count FROM files GROUP BY mime_type ORDER BY count DESC LIMIT 5`
    ).all(),
  ]);

  await logActivity(c, 'view_dashboard');

  return c.json({
    totalFiles: filesCount?.count || 0,
    totalSize: totalSize?.total || 0,
    recentUploads: recentUploads?.count || 0,
    topMimeTypes: topMimeTypes.results || [],
  });
});

// List all files (admin view)
admin.get('/files', adminAuthMiddleware, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;

  const [files, total] = await Promise.all([
    c.env.DB.prepare(
      `SELECT id, name, size, mime_type as mimeType, storage_key as storageKey, created_at as createdAt 
       FROM files 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all(),
    c.env.DB.prepare(`SELECT COUNT(*) as count FROM files`).first(),
  ]);

  await logActivity(c, 'view_files');

  return c.json({
    files: files.results || [],
    total: total?.count || 0,
    page,
    limit,
  });
});

// Delete file (admin)
admin.delete('/files/:id', adminAuthMiddleware, async (c) => {
  const fileId = c.req.param('id');

  const fileRecord = await c.env.DB.prepare(
    `SELECT storage_key, name FROM files WHERE id = ?`
  )
    .bind(fileId)
    .first();

  if (!fileRecord) {
    return c.json({ error: 'File not found' }, 404);
  }

  await c.env.R2_BUCKET.delete(fileRecord.storage_key as string);
  await c.env.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(fileId).run();

  await logActivity(c, 'delete_file', 'file', fileId, fileRecord.name as string);

  return c.json({ success: true });
});

// Activity logs
admin.get('/logs', adminAuthMiddleware, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = (page - 1) * limit;

  const logs = await c.env.DB.prepare(
    `SELECT 
      activity_logs.id,
      activity_logs.action,
      activity_logs.resource_type as resourceType,
      activity_logs.resource_id as resourceId,
      activity_logs.details,
      activity_logs.ip_address as ipAddress,
      activity_logs.created_at as createdAt,
      admin_users.email as userEmail,
      admin_users.full_name as userName
     FROM activity_logs
     LEFT JOIN admin_users ON activity_logs.admin_user_id = admin_users.id
     ORDER BY activity_logs.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all();

  await logActivity(c, 'view_logs');

  return c.json(logs.results || []);
});

// System info
admin.get('/system', adminAuthMiddleware, async (c) => {
  const [sessionCount, activeAdmins] = await Promise.all([
    c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM admin_sessions WHERE expires_at > datetime('now')`
    ).first(),
    c.env.DB.prepare(
      `SELECT COUNT(DISTINCT admin_user_id) as count 
       FROM admin_sessions 
       WHERE expires_at > datetime('now')`
    ).first(),
  ]);

  await logActivity(c, 'view_system_info');

  return c.json({
    activeSessions: sessionCount?.count || 0,
    activeAdmins: activeAdmins?.count || 0,
  });
});

export default admin;
