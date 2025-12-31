import { useState, useEffect } from 'react';
import { useAdminAuth, getAuthHeaders } from '@/react-app/hooks/useAdminAuth';
import AdminLayout from '@/react-app/components/AdminLayout';
import { Activity, User, Calendar, FileText } from 'lucide-react';

interface ActivityLog {
  id: number;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
}

export default function AdminLogs() {
  const { loading: authLoading } = useAdminAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      loadLogs();
    }
  }, [authLoading]);

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs?limit=100', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('login')) return 'text-green-400';
    if (action.includes('logout')) return 'text-gray-400';
    if (action.includes('delete')) return 'text-red-400';
    if (action.includes('create') || action.includes('upload')) return 'text-blue-400';
    return 'text-yellow-400';
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Activity Logs</h1>
          <p className="text-gray-400">Monitor all system activities and admin actions</p>
        </div>

        <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl border border-[rgba(255,204,0,0.3)] overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No activity logs available</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-6 hover:bg-[rgba(255,204,0,0.05)] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <div className="p-2 bg-[rgba(255,204,0,0.2)] rounded-lg">
                        <Activity className="w-5 h-5 text-[#ffcc00]" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <p className={`font-medium ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          {log.details && (
                            <p className="text-sm text-gray-400 mt-1">{log.details}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(log.createdAt)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {log.userEmail && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{log.userName || log.userEmail}</span>
                          </div>
                        )}
                        {log.resourceType && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>
                              {log.resourceType}
                              {log.resourceId && ` #${log.resourceId}`}
                            </span>
                          </div>
                        )}
                        {log.ipAddress && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs">IP: {log.ipAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
