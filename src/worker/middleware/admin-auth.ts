import { Context, Next } from 'hono';

export async function adminAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);

  // Verify session token
  const session = await c.env.DB.prepare(
    `SELECT admin_sessions.*, admin_users.email, admin_users.full_name, admin_users.is_super_admin 
     FROM admin_sessions 
     JOIN admin_users ON admin_sessions.admin_user_id = admin_users.id 
     WHERE admin_sessions.session_token = ? AND admin_sessions.expires_at > datetime('now')`
  )
    .bind(token)
    .first();

  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  // Attach user info to context
  c.set('adminUser', {
    id: session.admin_user_id,
    email: session.email,
    fullName: session.full_name,
    isSuperAdmin: session.is_super_admin === 1,
  });

  await next();
}

export async function logActivity(
  c: Context,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: string
) {
  const adminUser = c.get('adminUser');
  const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For');

  await c.env.DB.prepare(
    `INSERT INTO activity_logs (admin_user_id, action, resource_type, resource_id, details, ip_address) 
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      adminUser?.id || null,
      action,
      resourceType || null,
      resourceId || null,
      details || null,
      ipAddress || null
    )
    .run();
}
