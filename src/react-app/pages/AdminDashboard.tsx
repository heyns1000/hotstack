import { useState, useEffect } from 'react';
import { useAdminAuth, getAuthHeaders } from '@/react-app/hooks/useAdminAuth';
import AdminLayout from '@/react-app/components/AdminLayout';
import { Files, HardDrive, TrendingUp, FileType } from 'lucide-react';

interface DashboardStats {
  totalFiles: number;
  totalSize: number;
  recentUploads: number;
  topMimeTypes: Array<{ mime_type: string; count: number }>;
}

export default function AdminDashboard() {
  const { loading: authLoading } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      loadStats();
    }
  }, [authLoading]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
          <p className="text-gray-400">
            Monitor your HotStack system performance and activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Files */}
          <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-6 border border-[rgba(255,204,0,0.3)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Files className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Files</p>
                <p className="text-3xl font-bold text-white">{stats?.totalFiles || 0}</p>
              </div>
            </div>
          </div>

          {/* Total Storage */}
          <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-6 border border-[rgba(255,204,0,0.3)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <HardDrive className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Storage</p>
                <p className="text-3xl font-bold text-white">
                  {formatBytes(stats?.totalSize || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Uploads */}
          <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-6 border border-[rgba(255,204,0,0.3)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Last 24 Hours</p>
                <p className="text-3xl font-bold text-white">{stats?.recentUploads || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top File Types */}
        <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-6 border border-[rgba(255,204,0,0.3)]">
          <div className="flex items-center gap-3 mb-6">
            <FileType className="w-6 h-6 text-[#ffcc00]" />
            <h2 className="text-xl font-bold text-white">Top File Types</h2>
          </div>

          {stats?.topMimeTypes && stats.topMimeTypes.length > 0 ? (
            <div className="space-y-4">
              {stats.topMimeTypes.map((type, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">
                        {type.mime_type || 'Unknown'}
                      </span>
                      <span className="text-sm text-gray-400">{type.count} files</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-[#ffcc00] h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (type.count / (stats?.totalFiles || 1)) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No file types data available</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
