/**
 * Database helper class for user management
 * Handles user authentication, sessions, and audit logging
 */

import bcrypt from 'bcryptjs';

// Session configuration
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Generate a random session ID
 */
function generateSessionId() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Create a new user
 */
export async function createUser(db, email, password, username = null) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength (min 8 characters)
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const result = await db.prepare(
      'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)'
    ).bind(email, passwordHash, username).run();

    if (!result.success) {
      throw new Error('Failed to create user');
    }

    const userId = result.meta.last_row_id;

    // Create default user preferences
    await db.prepare(
      'INSERT INTO user_preferences (user_id) VALUES (?)'
    ).bind(userId).run();

    return { id: userId, email, username };
  } catch (error) {
    throw error;
  }
}

/**
 * Authenticate a user and create a session
 */
export async function authenticateUser(db, email, password) {
  try {
    // Get user
    const user = await db.prepare(
      'SELECT id, email, password_hash, username FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate session
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();

    // Create session
    await db.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, user.id, expiresAt).run();

    // Update last login
    await db.prepare(
      'UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?'
    ).bind(user.id).run();

    return {
      sessionId,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Verify a session and get user info
 */
export async function verifySession(db, sessionId) {
  try {
    if (!sessionId) {
      return null;
    }

    const result = await db.prepare(`
      SELECT s.id, s.user_id, s.expires_at, u.email, u.username
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).bind(sessionId).first();

    if (!result) {
      return null;
    }

    // Check if session expired
    const expiresAt = new Date(result.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired session
      await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
      return null;
    }

    return {
      sessionId: result.id,
      user: {
        id: result.user_id,
        email: result.email,
        username: result.username
      }
    };
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(db, sessionId) {
  try {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

/**
 * Log an audit event
 */
export async function logAudit(db, userId, action, details = null, ipAddress = null, userAgent = null) {
  try {
    await db.prepare(
      'INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, action, details, ipAddress, userAgent).run();
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

/**
 * Get user by ID
 */
export async function getUserById(db, userId) {
  try {
    const user = await db.prepare(
      'SELECT id, email, username, created_at, last_login_at FROM users WHERE id = ?'
    ).bind(userId).first();

    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(db) {
  try {
    await db.prepare(
      'DELETE FROM sessions WHERE expires_at < datetime(\'now\')'
    ).run();
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
}
