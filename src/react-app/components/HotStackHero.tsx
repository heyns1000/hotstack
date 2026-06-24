import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, CloudUpload, CheckCircle, Loader2 } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

export default function HotStackHero() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleFiles = async (files: FileList) => {
    if (timerExpired) {
      setUploadError('The 3-minute Omnidrop window has expired. Refresh to start a new timer.');
      return;
    }
    const file = files[0];
    if (file.type !== 'text/html' && file.type !== 'application/pdf') {
      setUploadError('Only HTML or PDF files can be omnidropped.');
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json() as { id: number; name: string };
      const id = `OMNI-${String(data.id).padStart(6, '0')}`;
      setProjectId(id);
      setUploadSuccess(true);
      setTimeout(() => {
        navigate(`/drop-zone?projectName=${encodeURIComponent(file.name.replace(/\.(html|pdf)$/i, ''))}&fileId=${data.id}`);
      }, 2000);
    } catch {
      setUploadError('Failed to omnidrop file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 text-center">
      <div className="relative bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-10 shadow-2xl border border-[rgba(255,204,0,0.3)]">

        {uploadSuccess && (
          <div className="absolute inset-0 rounded-xl bg-[rgba(14,14,14,0.95)] flex flex-col items-center justify-center gap-4 z-20">
            <CheckCircle className="w-16 h-16 text-[#ffcc00]" />
            <h2 className="text-2xl font-black text-white">Omnidrop Initiated!</h2>
            <p className="text-[#ffcc00] text-xl font-bold tracking-widest">{projectId}</p>
            <p className="text-gray-400 text-sm">Entering CodeNest™...</p>
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-5xl font-black text-white leading-tight">
            Fruitful | <span className="text-[#ffcc00]">HotStack™</span>
          </h1>
          <h2 className="text-xl font-normal text-gray-400 mt-2">
            Omnidrop Your Digital Presence. Live in Minutes. Branded Forever.
          </h2>
        </header>

        <CountdownTimer initialTime={180} onComplete={() => setTimerExpired(true)} />

        <div className="max-w-md mx-auto text-left mb-8 text-white">
          <h3 className="font-semibold mb-4">What Your Omnidrop Activates:</h3>
          <ul className="space-y-3 text-sm">
            {([
              ['Rapid Deployment:', 'Your Scroll goes Live in under 180 seconds via Omnidrop Signal.'],
              ['Integrated Ecosystem:', 'Auto DNS Hook + Curated Template Packs for seamless launch.'],
              ['Intelligent Foundation:', 'Powered by ScrollStack™, VaultDNS™, and MeshNest™ protocols.'],
              ['Treaty-Linked Economy:', 'Includes a Royalty-Linked License from Fruitful Global’s Treaty Grid.'],
              ['ClaimRoot™ Verified:', 'Secure, traceable site ownership for every deployed scroll.'],
            ] as [string, string][]).map(([label, desc]) => (
              <li key={label} className="flex items-start gap-3">
                <span className="text-[#ffcc00] text-lg shrink-0">&#9889;</span>
                <span><strong>{label}</strong> {desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => navigate('/drop-zone')}
          disabled={timerExpired}
          className={`inline-flex items-center gap-3 px-10 py-4 text-lg font-extrabold rounded-xl transition-all duration-300 ${
            timerExpired
              ? 'bg-gray-500 cursor-not-allowed opacity-60'
              : 'bg-[#ffcc00] text-black hover:bg-[#ffe066] hover:-translate-y-1 hover:scale-105 shadow-[0_4px_15px_rgba(255,204,0,0.4)] hover:shadow-[0_6px_20px_rgba(255,204,0,0.6)]'
          }`}
        >
          <ArrowRight className="w-5 h-5" />
          Enter Fruitful | CodeNest™
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.pdf"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`mt-8 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all select-none ${
            isDragging
              ? 'border-[#ffcc00] bg-[rgba(255,204,0,0.15)] shadow-[0_0_15px_rgba(255,204,0,0.6)] scale-105'
              : 'border-[#ffcc00] bg-[rgba(255,204,0,0.05)] hover:bg-[rgba(255,204,0,0.1)]'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-[#ffcc00]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-lg">Omnidropping into CodeNest™...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <CloudUpload className="w-8 h-8" />
              <p className="text-lg">
                Drag &amp; Drop HTML/PDF here or{' '}
                <span className="underline text-[#ffcc00]">Click to Upload</span>
              </p>
              <p className="text-sm text-gray-500">(Adheres to the 3-minute rule for rapid ingestion)</p>
            </div>
          )}
        </div>

        {uploadError && (
          <p className="mt-4 text-red-400 text-sm">{uploadError}</p>
        )}

        <footer className="mt-12 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span>Powered by Fruitful Global | ScrollSynced | Vault-Verified</span>
            <span className="text-gray-700">&bull;</span>
            <a href="/admin/login" className="text-gray-600 hover:text-[#ffcc00] transition-colors">Admin</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
