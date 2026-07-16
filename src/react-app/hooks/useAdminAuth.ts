import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');

    if (!token || !storedUser) {
      setLoading(false);
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Auth failed');
      }

      const userData = await response.json();
      setUser(userData);
    } catch {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  return { user, loading, logout };
}

export function getAuthHeaders() {
  const token = localStorage.getItem('admin_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
