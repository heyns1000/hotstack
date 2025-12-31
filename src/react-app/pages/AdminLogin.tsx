import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));

      // Navigate to admin dashboard
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-[rgba(255,204,0,0.3)]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[rgba(255,204,0,0.2)] rounded-full mb-4">
              <Lock className="w-8 h-8 text-[#ffcc00]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Fruitful | HotStack™
            </h1>
            <p className="text-gray-400">Global Admin Panel</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[rgba(42,42,46,0.9)] border border-[rgba(255,204,0,0.3)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ffcc00] focus:ring-2 focus:ring-[rgba(255,204,0,0.3)]"
                  placeholder="admin@fruitful.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[rgba(42,42,46,0.9)] border border-[rgba(255,204,0,0.3)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ffcc00] focus:ring-2 focus:ring-[rgba(255,204,0,0.3)]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#ffcc00] text-black font-bold rounded-lg hover:bg-[#ffe066] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Signing In...' : 'Sign In to Admin Panel'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
            <p>Powered by Fruitful Global | ClaimRoot™ Verified</p>
            <p className="mt-2">Default credentials: admin@fruitful.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
