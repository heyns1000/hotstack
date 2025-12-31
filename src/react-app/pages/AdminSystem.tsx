import { useState, useEffect } from 'react';
import { useAdminAuth, getAuthHeaders } from '@/react-app/hooks/useAdminAuth';
import AdminLayout from '@/react-app/components/AdminLayout';
import { Server, Users, Database, Activity } from 'lucide-react';

interface SystemInfo {
  activeSessions: number;
  activeAdmins: number;
}

export default function AdminSystem() {
  const { loading: authLoading } = useAdminAuth();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      loadSystemInfo();
    }
  }, [authLoading]);

  const loadSystemInfo = async () => {
    try {
      const response = await fetch('/api/admin/system', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setSystemInfo(data);
    } catch (error) {
      console.error('Failed to load system info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ffcc00] border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">System Information</h1>
          <p className="text-gray-400">Monitor system health and configuration</p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-6 border border-[rgba(255,204,0,0.3)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Activity className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Sessions</p>
                <p className="text-3xl font-bold text-white">
                  {systemInfo?.activeSessions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-6 border border-[rgba(255,204,0,0.3)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Admins</p>
                <p className="text-3xl font-bold text-white">
                  {systemInfo?.activeAdmins || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Details */}
        <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-6 border border-[rgba(255,204,0,0.3)]">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-6 h-6 text-[#ffcc00]" />
            <h2 className="text-xl font-bold text-white">Infrastructure</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Database</span>
              </div>
              <span className="text-sm px-3 py-1 bg-green-900/30 text-green-400 rounded-full">
                Cloudflare D1 (SQLite)
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Runtime</span>
              </div>
              <span className="text-sm px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full">
                Cloudflare Workers
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Object Storage</span>
              </div>
              <span className="text-sm px-3 py-1 bg-purple-900/30 text-purple-400 rounded-full">
                Cloudflare R2
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Framework</span>
              </div>
              <span className="text-sm px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-full">
                Hono + React + Vite
              </span>
            </div>
          </div>
        </div>

        {/* Branding Info */}
        <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-6 border border-[rgba(255,204,0,0.3)]">
          <h2 className="text-xl font-bold text-white mb-4">
            Fruitful | HotStack™ System
          </h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>
              <strong className="text-white">Version:</strong> 1.0.0
            </p>
            <p>
              <strong className="text-white">Protocol Stack:</strong> ScrollStack™ +
              VaultDNS™ + MeshNest™
            </p>
            <p>
              <strong className="text-white">Security:</strong> ClaimRoot™ Verified
            </p>
            <p>
              <strong className="text-white">License:</strong> Royalty-Linked from
              Fruitful Global Treaty Grid
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
