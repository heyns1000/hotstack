import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import FileSnapshot from '../components/FileSnapshot';

interface AIAnalysis {
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileType: string;
    uploadedAt: string;
    hasContent: boolean;
    contentLength: number;
    preview: string;
  };
  aiAnalysis: string;
  tags: string[];
  qualityScore: number;
  insights: {
    readyForProduction: boolean;
    securityStatus: string;
    recommendedActions: string[];
  };
}

interface DropZoneFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'analyzing' | 'completed' | 'error';
  progress: number;
  preview?: string;
  timestamp: string;
  aiAnalysis?: AIAnalysis;
  storageId?: number;
}

export default function HotStackDropZone() {
  const [files, setFiles] = useState<DropZoneFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DropZoneFile | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showSnapshot, setShowSnapshot] = useState<{ fileId: number; fileName: string; fileSize: number; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select the most recently completed file with AI analysis
  useEffect(() => {
    const latestCompleted = files.find(f => f.status === 'completed' && f.aiAnalysis && f.id !== selectedFile?.id);
    if (latestCompleted) {
      setSelectedFile(latestCompleted);
      showNotification(`✨ AI Analysis Complete: ${latestCompleted.name}`);
    }
  }, [files]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    const fileId = `${Date.now()}-${Math.random()}`;
    const newFile: DropZoneFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      timestamp: new Date().toISOString()
    };

    setFiles(prev => [newFile, ...prev]);
    setSelectedFile(newFile); // Auto-select the new file

    try {
      // Step 1: Upload file
      showNotification(`📤 Uploading: ${file.name}`);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'uploading', progress: 25 } : f
      ));

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const uploadResult = await uploadResponse.json();

      // Step 2: Immediate AI Analysis
      showNotification(`🧠 AI Analyzing: ${file.name}`);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'analyzing', 
          progress: 50,
          storageId: uploadResult.id 
        } : f
      ));

      const analysisFormData = new FormData();
      analysisFormData.append('file', file);

      const analysisResponse = await fetch('/api/dropzone/analyze', {
        method: 'POST',
        body: analysisFormData,
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('AI analysis error:', errorText);
        throw new Error(`AI analysis failed: ${errorText}`);
      }

      const analysisResult = await analysisResponse.json();
      
      console.log('AI Analysis Result:', analysisResult);

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'processing', 
          progress: 75,
          aiAnalysis: analysisResult
        } : f
      ));

      // Update selected file with AI analysis immediately
      setSelectedFile(prev => prev?.id === fileId ? {
        ...prev,
        aiAnalysis: analysisResult,
        status: 'processing',
        progress: 75
      } : prev);

      // Step 3: Final processing
      await new Promise(resolve => setTimeout(resolve, 800));

      const completedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'completed' as const,
        progress: 100,
        preview: uploadResult.url,
        timestamp: new Date().toISOString(),
        aiAnalysis: analysisResult,
        storageId: uploadResult.id
      };

      setFiles(prev => prev.map(f => 
        f.id === fileId ? completedFile : f
      ));

      // Update selected file to completed state
      setSelectedFile(prev => prev?.id === fileId ? completedFile : prev);

      // Show AI insights notification
      const qualityEmoji = analysisResult.qualityScore >= 80 ? '🌟' : 
                          analysisResult.qualityScore >= 60 ? '✅' : '⚠️';
      showNotification(`${qualityEmoji} Analysis Complete: Quality ${analysisResult.qualityScore}% - ${analysisResult.insights.readyForProduction ? 'Production Ready' : 'Needs Review'}`);

      // Show VaultMesh snapshot
      setShowSnapshot({
        fileId: uploadResult.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      });

      // Auto-hide snapshot after 10 seconds
      setTimeout(() => setShowSnapshot(null), 10000);

    } catch (error) {
      console.error('File processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error', progress: 0 } : f
      ));
      showNotification(`❌ Error: ${errorMessage}`);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setProcessing(true);

    const droppedFiles = Array.from(e.dataTransfer.files);
    
    for (const file of droppedFiles) {
      await processFile(file);
    }

    setProcessing(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    setProcessing(true);
    const selectedFiles = Array.from(e.target.files);
    
    for (const file of selectedFiles) {
      await processFile(file);
    }
    
    setProcessing(false);
  };

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
    if (type.includes('csv')) return '📈';
    if (type.includes('zip') || type.includes('archive')) return '📦';
    return '📁';
  };

  const getStatusIcon = (status: DropZoneFile['status']) => {
    switch (status) {
      case 'uploading': return '📤';
      case 'processing': return '⚙️';
      case 'analyzing': return '🧠';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusText = (status: DropZoneFile['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading to storage...';
      case 'processing': return 'Processing file...';
      case 'analyzing': return 'AI analyzing content...';
      case 'completed': return 'Complete & Ready';
      case 'error': return 'Error occurred';
      default: return 'Waiting...';
    }
  };

  const extractAIHighlight = (aiText: string): string => {
    // Extract first meaningful sentence or key finding
    const lines = aiText.split('\n').filter(l => l.trim());
    for (const line of lines) {
      if (line.includes('**') || line.length > 50) {
        return line.replace(/\*\*/g, '').substring(0, 120) + (line.length > 120 ? '...' : '');
      }
    }
    return lines[0]?.substring(0, 120) + '...' || 'AI analysis complete';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-24 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-white/20 backdrop-blur-md animate-slide-in max-w-md">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔔</div>
            <div className="flex-1 text-sm font-semibold">{notification}</div>
            <button 
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="text-4xl">🔥</span>
              <div>
                <h1 className="text-2xl font-black text-white">HotStack Drop Zone</h1>
                <p className="text-xs text-gray-400">AI-Powered Instant Analysis</p>
              </div>
            </Link>
            <div className="flex gap-4">
              <Link to="/hotstack" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all">
                HotStack Admin
              </Link>
              <Link to="/scroll" className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-all">
                📜 View Scroll
              </Link>
              <Link to="/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all">
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-2">📂</div>
            <div className="text-3xl font-black text-blue-400">{files.length}</div>
            <div className="text-white font-semibold">Total Files</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-2 animate-pulse">🧠</div>
            <div className="text-3xl font-black text-purple-400">
              {files.filter(f => f.status === 'analyzing').length}
            </div>
            <div className="text-white font-semibold">AI Processing</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-black text-green-400">
              {files.filter(f => f.status === 'completed').length}
            </div>
            <div className="text-white font-semibold">Analyzed</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:scale-105 transition-transform">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-3xl font-black text-yellow-400">
              {files.length > 0 
                ? Math.round(files.reduce((sum, f) => sum + (f.aiAnalysis?.qualityScore || 0), 0) / files.length)
                : 0}
            </div>
            <div className="text-white font-semibold">Avg Quality</div>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative bg-white/10 backdrop-blur-md rounded-2xl p-12 border-4 border-dashed transition-all duration-300 mb-8 ${
            isDragging 
              ? 'border-blue-500 bg-blue-500/20 scale-105 shadow-2xl shadow-blue-500/50' 
              : 'border-white/30 hover:border-white/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".html,.pdf,.json,.csv,.txt,.xml,.md"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="text-center">
            <div className="text-8xl mb-6 animate-bounce">🔥</div>
            <h2 className="text-4xl font-black text-white mb-4">
              {isDragging ? 'Drop Files Here!' : 'Instant AI Analysis'}
            </h2>
            <p className="text-xl text-gray-300 mb-2">
              Upload files for immediate AI-powered insights
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Gemini AI analyzes your files automatically • No configuration needed
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl text-lg transition-all transform hover:scale-105 shadow-2xl ${
                processing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {processing ? '⏳ Processing...' : '📁 Select Files to Analyze'}
            </button>
          </div>

          {processing && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin text-6xl mb-4">🧠</div>
                <div className="text-white text-xl font-bold">AI Analyzing...</div>
                <div className="text-gray-300 text-sm mt-2">Extracting insights with Gemini AI</div>
              </div>
            </div>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Files Grid */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <span>📋</span> Processing Queue
              </h3>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {files.map(file => (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`bg-black/30 rounded-xl p-4 border transition-all cursor-pointer hover:bg-black/40 ${
                      selectedFile?.id === file.id ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-xl' :
                      file.status === 'completed' ? 'border-green-500/50' :
                      file.status === 'error' ? 'border-red-500/50' :
                      file.status === 'analyzing' ? 'border-purple-500/50 ring-2 ring-purple-500/30' :
                      'border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{getFileIcon(file.type)}</div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{file.name}</h4>
                            <p className="text-xs text-gray-400">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <div className="text-xl ml-2">{getStatusIcon(file.status)}</div>
                        </div>

                        {/* Progress Bar */}
                        {file.status !== 'completed' && file.status !== 'error' && (
                          <div className="mb-2">
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  file.status === 'analyzing' 
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse' 
                                    : file.status === 'processing'
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse' 
                                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                }`}
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                              {file.status === 'analyzing' && <span className="animate-pulse">🧠</span>}
                              {getStatusText(file.status)}
                            </p>
                          </div>
                        )}

                        {/* AI Insight Preview */}
                        {file.aiAnalysis && file.status === 'completed' && (
                          <div className="mt-2 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-purple-400 text-xs font-bold">🧠 AI INSIGHT</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                file.aiAnalysis.qualityScore >= 80 ? 'bg-green-500/30 text-green-300' :
                                file.aiAnalysis.qualityScore >= 60 ? 'bg-yellow-500/30 text-yellow-300' :
                                'bg-red-500/30 text-red-300'
                              }`}>
                                {file.aiAnalysis.qualityScore}% Quality
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                              {extractAIHighlight(file.aiAnalysis.aiAnalysis)}
                            </p>
                            {file.aiAnalysis.tags.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {file.aiAnalysis.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-xs px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quality Score Bar */}
                        {file.aiAnalysis && file.status === 'completed' && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">Quality:</span>
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  file.aiAnalysis.qualityScore >= 80 ? 'bg-green-500' :
                                  file.aiAnalysis.qualityScore >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${file.aiAnalysis.qualityScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-white">
                              {file.aiAnalysis.qualityScore}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis Panel */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <span>🧠</span> AI Analysis
                {selectedFile?.status === 'analyzing' && (
                  <span className="text-sm text-purple-400 animate-pulse">● Analyzing...</span>
                )}
              </h3>

              {selectedFile && selectedFile.aiAnalysis ? (
                <div className="space-y-6 max-h-[600px] overflow-y-auto">
                  {/* File Info */}
                  <div className="bg-black/30 rounded-xl p-4 border-2 border-blue-500/30">
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <span>{getFileIcon(selectedFile.type)}</span>
                      {selectedFile.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white ml-2">{selectedFile.aiAnalysis.metadata.fileType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Size:</span>
                        <span className="text-white ml-2">{formatFileSize(selectedFile.size)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Quality:</span>
                        <span className={`ml-2 font-bold ${
                          selectedFile.aiAnalysis.qualityScore >= 80 ? 'text-green-400' :
                          selectedFile.aiAnalysis.qualityScore >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {selectedFile.aiAnalysis.qualityScore}% {
                            selectedFile.aiAnalysis.qualityScore >= 80 ? '🌟' :
                            selectedFile.aiAnalysis.qualityScore >= 60 ? '✅' : '⚠️'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className={`ml-2 font-bold ${
                          selectedFile.aiAnalysis.insights.readyForProduction 
                            ? 'text-green-400' 
                            : 'text-yellow-400'
                        }`}>
                          {selectedFile.aiAnalysis.insights.readyForProduction ? '✓ Production Ready' : '⚠ Needs Review'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-5 border-2 border-purple-500/40 shadow-xl">
                    <h5 className="text-md font-bold text-white mb-3 flex items-center gap-2">
                      ✨ AI Insights (Powered by Gemini)
                    </h5>
                    <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {selectedFile.aiAnalysis.aiAnalysis}
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedFile.aiAnalysis.tags.length > 0 && (
                    <div className="bg-black/30 rounded-xl p-4 border border-blue-500/30">
                      <h5 className="text-md font-bold text-white mb-3">🏷️ Smart Tags</h5>
                      <div className="flex gap-2 flex-wrap">
                        {selectedFile.aiAnalysis.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-sm font-semibold border border-blue-500/50">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {selectedFile.aiAnalysis.insights.recommendedActions.length > 0 && (
                    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-500/30">
                      <h5 className="text-md font-bold text-white mb-3 flex items-center gap-2">
                        💡 AI Recommendations
                      </h5>
                      <ul className="space-y-2">
                        {selectedFile.aiAnalysis.insights.recommendedActions.map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-200 flex items-start gap-2 bg-black/20 p-2 rounded">
                            <span className="text-green-400 font-bold">→</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : selectedFile?.status === 'analyzing' ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 animate-spin">🧠</div>
                  <p className="text-white text-lg font-bold mb-2">AI Analysis in Progress...</p>
                  <p className="text-gray-300 text-sm">Gemini is extracting insights from your file</p>
                  <div className="mt-6 bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2 text-purple-300 text-sm">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <span className="ml-2">Processing content</span>
                    </div>
                  </div>
                </div>
              ) : selectedFile ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⏳</div>
                  <p className="text-gray-300">Preparing AI analysis...</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-gray-300 mb-2">Upload a file to see instant AI analysis</p>
                  <p className="text-gray-500 text-sm">Files are automatically analyzed by Gemini AI</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🚀</span> Instant AI Processing Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-xl">✓</span>
              <div>
                <strong className="text-white">Immediate Analysis:</strong> AI insights appear instantly as files upload - no waiting required
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-xl">✓</span>
              <div>
                <strong className="text-white">Auto-Select:</strong> Newly uploaded files are automatically selected and analyzed
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-xl">✓</span>
              <div>
                <strong className="text-white">Real-Time Notifications:</strong> Get instant alerts when AI analysis completes
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-xl">✓</span>
              <div>
                <strong className="text-white">Quality Scoring:</strong> Automatic quality assessment and production readiness check
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-xl">✓</span>
              <div>
                <strong className="text-white">Smart Insights:</strong> Gemini AI provides actionable recommendations and highlights
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-xl">✓</span>
              <div>
                <strong className="text-white">Secure Storage:</strong> Files stored in R2 with global CDN distribution
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VaultMesh Snapshot */}
      {showSnapshot && (
        <FileSnapshot
          fileId={showSnapshot.fileId}
          fileName={showSnapshot.fileName}
          fileSize={showSnapshot.fileSize}
          mimeType={showSnapshot.mimeType}
          userId="root"
          onClose={() => setShowSnapshot(null)}
        />
      )}
    </div>
  );
}
