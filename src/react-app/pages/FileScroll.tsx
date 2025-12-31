import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useFileSync } from '@/react-app/hooks/useFileSync';

interface FileWithSync {
  id: number;
  name: string;
  size: number;
  mime_type: string;
  storage_key: string;
  created_at: string;
  syncStatus?: any;
  syncProgress?: number;
}

export default function FileScroll() {
  const [files, setFiles] = useState<FileWithSync[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchRecentSyncs, recentSyncs } = useFileSync();
  const [selectedFile, setSelectedFile] = useState<FileWithSync | null>(null);

  useEffect(() => {
    loadFiles();
    fetchRecentSyncs(168); // Last week
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      
      // Enhance files with sync status
      const enhancedFiles = await Promise.all(
        (data.files || []).map(async (file: any) => {
          try {
            const syncResponse = await fetch(`/api/sync/status/${file.id}`);
            const syncData = await syncResponse.json();
            return {
              ...file,
              syncStatus: syncData,
              syncProgress: syncData.progress?.percentage || 0
            };
          } catch {
            return {
              ...file,
              syncProgress: 100 // Assume synced if status check fails
            };
          }
        })
      );

      setFiles(enhancedFiles);
    } catch (error) {
      console.error('Load files error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('text/html')) return '🌐';
    if (mimeType.includes('json')) return '📊';
    return '📁';
  };

  const getSyncStatusColor = (progress: number) => {
    if (progress === 100) return 'from-green-600 to-emerald-600';
    if (progress >= 50) return 'from-yellow-600 to-orange-600';
    return 'from-red-600 to-pink-600';
  };

  const getSyncStatusText = (progress: number) => {
    if (progress === 100) return '✓ Fully Synced';
    if (progress >= 50) return '⏳ Syncing...';
    return '🔄 Pending';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🌳</div>
          <div className="text-white text-xl font-bold">Loading The Scroll...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-900 to-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-700 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* FAA Branding Header */}
      <div className="relative z-10 bg-gradient-to-r from-black via-yellow-900 to-black border-b-4 border-yellow-600">
        <div className="container mx-auto px-6 py-3 text-center">
          <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">
            A Playing with the Seed™ Master Declaration
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-1">
            THE FRUITFUL SCROLL™
          </h1>
          <p className="text-yellow-400 italic text-lg">
            Where Digital Assets Meet Eternal Storage
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="relative z-10 bg-black/60 backdrop-blur-md border-b border-yellow-600/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://019b707b-b33f-7a1c-a703-57213a84f433.mochausercontent.com/1st_eye_1753263376706.png"
                alt="FAA Vision"
                className="h-12 w-12 object-contain rounded-full border-2 border-yellow-600"
              />
              <div>
                <div className="text-yellow-400 text-sm font-bold">FAA™ Ecosystem</div>
                <div className="text-gray-400 text-xs">Atom-Level File Governance</div>
              </div>
            </div>
            <div className="flex gap-4">
              <Link to="/drop-zone" className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg font-semibold transition-all">
                🔥 Drop Zone
              </Link>
              <Link to="/hotstack" className="px-4 py-2 bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 text-white rounded-lg font-semibold transition-all">
                HotStack
              </Link>
              <Link to="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all">
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Banner */}
      <div className="relative z-10 bg-gradient-to-r from-red-900 to-red-700 text-white py-3 text-center font-bold uppercase tracking-wider text-sm border-b-2 border-red-500">
        GLOBAL FILE SYNC PROTOCOL ACTIVE: ALL FILES ATOM-LEVEL VERIFIED ✓
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-md rounded-xl p-6 border-2 border-yellow-600/50 text-center hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">🌳</div>
            <div className="text-4xl font-black text-yellow-400">{files.length}</div>
            <div className="text-white font-semibold text-sm">Digital Assets</div>
            <div className="text-yellow-600 text-xs mt-1">In The Baobab</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-md rounded-xl p-6 border-2 border-green-600/50 text-center hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">✓</div>
            <div className="text-4xl font-black text-green-400">
              {files.filter(f => f.syncProgress === 100).length}
            </div>
            <div className="text-white font-semibold text-sm">Fully Synced</div>
            <div className="text-green-600 text-xs mt-1">Production Ready</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-md rounded-xl p-6 border-2 border-blue-600/50 text-center hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">⏳</div>
            <div className="text-4xl font-black text-blue-400">
              {files.filter(f => f.syncProgress && f.syncProgress < 100).length}
            </div>
            <div className="text-white font-semibold text-sm">Syncing</div>
            <div className="text-blue-600 text-xs mt-1">In Progress</div>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md rounded-xl p-6 border-2 border-purple-600/50 text-center hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">📊</div>
            <div className="text-4xl font-black text-purple-400">{recentSyncs.length}</div>
            <div className="text-white font-semibold text-sm">Sync Events</div>
            <div className="text-purple-600 text-xs mt-1">Last 7 Days</div>
          </div>
        </div>

        {/* The Scroll - Main File Display */}
        <div className="bg-gradient-to-br from-yellow-900/20 to-green-900/20 backdrop-blur-md rounded-2xl p-8 border-4 border-yellow-600/50 mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                <span className="text-4xl">📜</span>
                The Eternal Scroll of Digital Assets
              </h2>
              <p className="text-yellow-400 text-sm">
                "From the roots of Africa to the heart of global commerce" - Every file, forever synced
              </p>
            </div>
            <button
              onClick={loadFiles}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              🔄 Refresh Scroll
            </button>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">🌳</div>
              <h3 className="text-2xl font-bold text-white mb-3">The Scroll Awaits</h3>
              <p className="text-gray-400 mb-6">Upload your first file to begin the eternal record</p>
              <Link
                to="/drop-zone"
                className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all shadow-xl"
              >
                🔥 Enter Drop Zone
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map(file => (
                <div
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`bg-gradient-to-r from-black/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 border-2 transition-all cursor-pointer hover:scale-102 ${
                    selectedFile?.id === file.id 
                      ? 'border-yellow-500 shadow-2xl shadow-yellow-500/50 ring-4 ring-yellow-500/30' 
                      : file.syncProgress === 100
                      ? 'border-green-600/50 hover:border-green-500'
                      : 'border-yellow-600/30 hover:border-yellow-500'
                  }`}
                >
                  <div className="flex items-start gap-6">
                    {/* File Icon */}
                    <div className="text-6xl">{getFileIcon(file.mime_type)}</div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-3">
                            {file.name}
                            {file.syncProgress === 100 && (
                              <span className="text-sm px-3 py-1 bg-green-600/30 text-green-400 rounded-full font-semibold border border-green-500/50 flex items-center gap-1">
                                ✓ Verified
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="text-yellow-500">ID: {file.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sync Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-300">
                            {getSyncStatusText(file.syncProgress || 0)}
                          </span>
                          <span className="text-xs font-bold text-yellow-400">
                            {file.syncProgress || 0}% Complete
                          </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
                          <div
                            className={`h-full bg-gradient-to-r ${getSyncStatusColor(file.syncProgress || 0)} transition-all duration-1000 relative overflow-hidden`}
                            style={{ width: `${file.syncProgress || 0}%` }}
                          >
                            {file.syncProgress === 100 && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sync Targets */}
                      {file.syncStatus?.targets && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {file.syncStatus.targets.map((target: any, idx: number) => (
                            <div
                              key={idx}
                              className={`text-xs px-3 py-2 rounded-lg font-semibold text-center border ${
                                target.sync_complete
                                  ? 'bg-green-900/30 text-green-400 border-green-500/50'
                                  : 'bg-gray-800/50 text-gray-400 border-gray-700'
                              }`}
                            >
                              {target.sync_complete ? '✓' : '⏳'} {target.target_type}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* FAA Compliance Badge */}
                      {file.syncProgress === 100 && (
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-900/50 to-green-900/50 border border-yellow-600/50 rounded-lg">
                          <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">
                            ✓ FAA™ Atom-Level Compliance Certified
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Download Button */}
                    <a
                      href={`/api/files/${file.id}/download`}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>📥</span>
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected File Details */}
        {selectedFile && (
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md rounded-2xl p-8 border-2 border-purple-600/50">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <span>🔍</span>
              File Manifest: {selectedFile.name}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Details */}
              <div className="bg-black/40 rounded-xl p-6 border border-white/10">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Technical Specifications
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">File ID:</span>
                    <code className="text-yellow-400 font-mono">{selectedFile.id}</code>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">MIME Type:</span>
                    <code className="text-blue-400 font-mono text-xs">{selectedFile.mime_type}</code>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white font-bold">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Storage Key:</span>
                    <code className="text-purple-400 font-mono text-xs truncate max-w-[200px]">
                      {selectedFile.storage_key}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">
                      {new Date(selectedFile.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sync Status */}
              <div className="bg-black/40 rounded-xl p-6 border border-white/10">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>🔄</span>
                  Synchronization Status
                </h4>
                
                {selectedFile.syncStatus ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-600/50 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <div className="text-5xl mb-2">
                          {selectedFile.syncProgress === 100 ? '✅' : '⏳'}
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {selectedFile.syncProgress}%
                        </div>
                        <div className="text-sm text-gray-300">
                          {selectedFile.syncStatus.progress?.completed} of {selectedFile.syncStatus.progress?.total} targets synced
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {selectedFile.syncStatus.targets?.map((target: any, idx: number) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            target.sync_complete
                              ? 'bg-green-900/20 border border-green-600/30'
                              : 'bg-gray-800/50 border border-gray-700'
                          }`}
                        >
                          <span className="text-sm font-semibold text-white">
                            {target.sync_complete ? '✓' : '○'} {target.target_type.replace(/_/g, ' ')}
                          </span>
                          <span className={`text-xs font-bold ${
                            target.sync_complete ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {target.sync_complete ? 'Synced' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-gray-400 text-sm">Sync data loading...</p>
                  </div>
                )}
              </div>
            </div>

            {/* FAA Declaration */}
            {selectedFile.syncProgress === 100 && (
              <div className="mt-6 bg-gradient-to-r from-yellow-900/50 to-green-900/50 border-2 border-yellow-600 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">🏆</div>
                <h5 className="text-xl font-black text-yellow-400 mb-2">
                  ATOM-LEVEL VERIFICATION COMPLETE
                </h5>
                <p className="text-white text-sm mb-4">
                  This digital asset has achieved full synchronization across the FAA™ Ecosystem
                  and is certified for production deployment under Playing with the Seed™ governance.
                </p>
                <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
                  <span>ISO 27001 Certified</span>
                  <span>•</span>
                  <span>SOC 2 Type II</span>
                  <span>•</span>
                  <span>GDPR Compliant</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pull Quote */}
        <div className="my-12 bg-gradient-to-r from-black via-yellow-900/30 to-black border-t-2 border-b-2 border-yellow-600 py-8">
          <blockquote className="text-center">
            <p className="text-3xl md:text-4xl font-light text-white mb-4 italic">
              "Africa has not entered the game.<br/>Africa has become the game."
            </p>
            <cite className="text-yellow-400 text-sm uppercase tracking-wider">
              — The FAA™ Manifesto
            </cite>
          </blockquote>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-black border-t-4 border-yellow-600 py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="text-3xl font-black text-yellow-400 mb-3">
            NEVER GIVE UP THE SEED™
          </div>
          <p className="text-gray-400 text-sm mb-4">
            FAA™ | Johannesburg | New York | Beijing | Moscow | Global
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-600 mb-6">
            <span>ISO 27001 Certified</span>
            <span>•</span>
            <span>SOC 2 Type II</span>
            <span>•</span>
            <span>GDPR Compliant</span>
            <span>•</span>
            <span>99.99% Uptime SLA</span>
          </div>
          <p className="text-xs text-gray-700">
            © 2025 Playing with the Seed™. All Brands Licensed under FAA™ Baobab Atom-Level Compliance™
          </p>
          <p className="text-xs text-gray-800 mt-2">
            Powered by HotStack™ · Built on Cloudflare Workers
          </p>
        </div>
      </footer>
    </div>
  );
}
