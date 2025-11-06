/**
 * HotStack Authentication Utilities
 * Client-side JavaScript for user authentication
 */

class AuthClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.currentUser = null;
    this.sessionId = null;
  }

  /**
   * Sign up a new user
   */
  async signup(email, password, username = null) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign in an existing user
   */
  async signin(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signin failed');
      }

      this.sessionId = data.sessionId;
      this.currentUser = data.user;
      
      // Store session in localStorage as backup
      localStorage.setItem('sessionId', data.sessionId);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  async signout() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getSessionId()}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signout failed');
      }

      // Clear local state
      this.currentUser = null;
      this.sessionId = null;
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getSessionId()}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        // Clear invalid session
        this.currentUser = null;
        this.sessionId = null;
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        throw new Error(data.error || 'Not authenticated');
      }

      this.currentUser = data.user;
      return data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getSessionId();
  }

  /**
   * Get session ID from memory or localStorage
   */
  getSessionId() {
    if (this.sessionId) {
      return this.sessionId;
    }
    return localStorage.getItem('sessionId');
  }

  /**
   * Get user from memory or localStorage
   */
  getUser() {
    if (this.currentUser) {
      return this.currentUser;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Make an authenticated API request
   */
  async authenticatedFetch(url, options = {}) {
    const sessionId = this.getSessionId();
    if (!sessionId) {
      throw new Error('Not authenticated');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${sessionId}`,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // If unauthorized, clear session
    if (response.status === 401) {
      this.currentUser = null;
      this.sessionId = null;
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
    }

    return response;
  }
}

// Create global instance
const auth = new AuthClient();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthClient, auth };
}
