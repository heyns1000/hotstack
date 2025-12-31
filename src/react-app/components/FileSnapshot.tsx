import { useState, useEffect } from 'react';

interface FileSnapshotProps {
  fileId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  userId?: string;
  onClose?: () => void;
}

export default function FileSnapshot({ fileId, fileName, fileSize, mimeType, userId = 'root', onClose }: FileSnapshotProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add to VaultMesh as snapshot
    const addToVaultMesh = async () => {
      try {
        await fetch('/api/vaultmesh/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_id: fileId,
            user_id: userId,
            folder_name: 'snapshots',
            is_snapshot: true
          })
        });
      } catch (error) {
        console.error('Error creating snapshot:', error);
      } finally {
        setLoading(false);
      }
    };

    addToVaultMesh();
  }, [fileId, userId]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type === 'application/pdf') return '📄';
    if (type.includes('text/html')) return '🌐';
    if (type.includes('json')) return '📊';
    return '📁';
  };

  if (loading) {
    return (
      <div className="fixed bottom-8 right-8 bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl p-6 shadow-2xl z-50 min-w-[400px] animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="animate-spin text-4xl">⚙️</div>
          <div>
            <div className="text-white font-bold text-lg">Creating Snapshot...</div>
            <div className="text-purple-300 text-sm">Adding to VaultMesh</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 bg-gradient-to-br from-green-900/95 to-emerald-900/95 backdrop-blur-xl border-2 border-green-500/50 rounded-2xl p-6 shadow-2xl z-50 min-w-[400px] max-w-[500px] animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-5xl">{getFileIcon(mimeType)}</div>
          <div>
            <div className="text-white font-bold text-lg flex items-center gap-2">
              <span>📸 Snapshot Created</span>
              <span className="animate-pulse">✨</span>
            </div>
            <div className="text-green-300 text-sm">Saved to VaultMesh</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl transition-colors leading-none"
          >
            ✕
          </button>
        )}
      </div>

      <div className="bg-black/30 rounded-xl p-4 mb-4 border border-green-500/30">
        <div className="text-white font-semibold mb-2 truncate">{fileName}</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-green-300">Size:</span>
            <span className="text-white ml-2">{formatFileSize(fileSize)}</span>
          </div>
          <div>
            <span className="text-green-300">Type:</span>
            <span className="text-white ml-2">{mimeType.split('/')[1]?.toUpperCase() || 'File'}</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/40 rounded-lg p-3 mb-4">
        <div className="text-green-300 text-xs font-bold mb-1">📁 VaultMesh Location</div>
        <div className="text-white text-sm font-mono">
          /{userId}/snapshots/{fileName}
        </div>
      </div>

      <div className="flex gap-3">
        <a
          href={`/api/files/${fileId}/download`}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-center transition-all text-sm"
        >
          📥 Download
        </a>
        <button
          onClick={() => window.open(`/vaultmesh?user=${userId}`, '_blank')}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all text-sm"
        >
          📂 Open VaultMesh
        </button>
      </div>

      <div className="mt-3 text-center text-xs text-green-300">
        Auto-saved to your VaultMesh folder • View anytime
      </div>
    </div>
  );
}
