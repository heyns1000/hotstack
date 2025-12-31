import { useState, useEffect } from 'react';
import { useAdminAuth, getAuthHeaders } from '@/react-app/hooks/useAdminAuth';
import AdminLayout from '@/react-app/components/AdminLayout';
import { File, Download, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FileRecord } from '@/shared/types';

interface FilesResponse {
  files: FileRecord[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminFiles() {
  const { loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<FilesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading) {
      loadFiles();
    }
  }, [authLoading, page]);

  const loadFiles = async () => {
    try {
      const response = await fetch(`/api/admin/files?page=${page}&limit=50`, {
        headers: getAuthHeaders(),
      });
      const filesData = await response.json();
      setData(filesData);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: FileRecord) => {
    if (!confirm(`Delete ${file.name}?`)) return;

    try {
      const response = await fetch(`/api/admin/files/${file.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Delete failed');

      await loadFiles();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete file');
    }
  };

  const handleDownload = async (file: FileRecord) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredFiles =
    data?.files.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const totalPages = Math.ceil((data?.total || 0) / (data?.limit || 50));

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
          <h1 className="text-3xl font-bold text-white mb-2">File Management</h1>
          <p className="text-gray-400">View and manage all uploaded files</p>
        </div>

        {/* Search */}
        <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-4 border border-[rgba(255,204,0,0.3)]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[rgba(42,42,46,0.9)] border border-[rgba(255,204,0,0.3)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ffcc00] focus:ring-2 focus:ring-[rgba(255,204,0,0.3)]"
            />
          </div>
        </div>

        {/* Files Table */}
        <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl border border-[rgba(255,204,0,0.3)] overflow-hidden">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <File className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No files found' : 'No files uploaded yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-700 bg-[rgba(42,42,46,0.5)]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredFiles.map((file) => (
                      <tr
                        key={file.id}
                        className="hover:bg-[rgba(255,204,0,0.05)] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-[rgba(255,204,0,0.2)] rounded-lg p-2">
                              <File className="w-5 h-5 text-[#ffcc00]" />
                            </div>
                            <span className="font-medium text-white truncate max-w-md">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatBytes(file.size)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {file.mimeType}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatDate(file.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(file)}
                              className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {filteredFiles.length} of {data?.total || 0} files
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 text-gray-400 hover:text-white hover:bg-[rgba(255,204,0,0.1)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 text-gray-400 hover:text-white hover:bg-[rgba(255,204,0,0.1)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
