import { useState, useEffect } from 'react';
import { File, Download, Trash2, Search, FolderOpen } from 'lucide-react';
import type { FileRecord } from '@/shared/types';

export default function FileManager() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      uploadFiles(Array.from(selectedFiles));
    }
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    setUploadingFiles(filesToUpload);

    for (const file of filesToUpload) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        await loadFiles();
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setTimeout(() => {
      setUploadingFiles([]);
      setUploadProgress({});
    }, 1000);
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

  const handleDelete = async (file: FileRecord) => {
    if (!confirm(`Delete ${file.name}?`)) return;

    try {
      await fetch(`/api/files/${file.id}`, { method: 'DELETE' });
      setFiles(files.filter((f) => f.id !== file.id));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number) => {
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

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
      <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-[rgba(255,204,0,0.3)]">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">File Vault</h2>
          <p className="text-gray-400">Manage your omnidropped files with ClaimRoot™ verification</p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <label className="cursor-pointer inline-flex items-center gap-3 px-6 py-3 bg-[#ffcc00] text-black font-bold rounded-lg hover:bg-[#ffe066] transition-all transform hover:scale-105">
            <FolderOpen className="w-5 h-5" />
            <span>Upload Files</span>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {uploadingFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadingFiles.map((file) => (
                <div key={file.name} className="bg-[rgba(255,204,0,0.1)] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">{file.name}</span>
                    <span className="text-[#ffcc00] text-sm">{uploadProgress[file.name] || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-[#ffcc00] h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress[file.name] || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
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

        {/* Files List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#ffcc00] border-t-transparent"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
            <File className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">{searchQuery ? 'No files found' : 'No files uploaded yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[rgba(255,204,0,0.05)] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-[rgba(255,204,0,0.2)] rounded-lg p-2">
                          <File className="w-5 h-5 text-[#ffcc00]" />
                        </div>
                        <span className="font-medium text-white truncate max-w-md">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
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
        )}
      </div>
    </div>
  );
}
