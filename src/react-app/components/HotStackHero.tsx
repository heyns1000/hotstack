import { useState } from 'react';
import { ArrowRight, CloudUpload } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

interface HotStackHeroProps {
  onTimerComplete: () => void;
  timerExpired: boolean;
  onFilesDrop: (files: FileList) => void;
}

export default function HotStackHero({ onTimerComplete, timerExpired, onFilesDrop }: HotStackHeroProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (timerExpired) {
      alert('The 3-minute Omnidrop window has expired. Please refresh the page to start a new ingestion timer.');
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFilesDrop(files);
    }
  };

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 text-center">
      <div className="bg-[rgba(14,14,14,0.85)] backdrop-blur-sm rounded-xl p-10 shadow-2xl border border-[rgba(255,204,0,0.3)]">
        <header className="mb-8">
          <h1 className="text-5xl font-black text-white leading-tight">
            Fruitful | <span className="text-[#ffcc00]">HotStack™</span>
          </h1>
          <h2 className="text-xl font-normal text-gray-400 mt-2">
            Omnidrop Your Digital Presence. Live in Minutes. Branded Forever.
          </h2>
        </header>

        <CountdownTimer initialTime={180} onComplete={onTimerComplete} />

        <div className="max-w-md mx-auto text-left mb-8 text-white">
          <h3 className="font-semibold mb-4">What Your Omnidrop Activates:</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-[#ffcc00] text-lg">⚡</span>
              <span><strong>Rapid Deployment:</strong> Your Scroll goes Live in under 180 seconds via Omnidrop Signal.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ffcc00] text-lg">⚡</span>
              <span><strong>Integrated Ecosystem:</strong> Auto DNS Hook + Curated Template Packs for seamless launch.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ffcc00] text-lg">⚡</span>
              <span><strong>Intelligent Foundation:</strong> Powered by ScrollStack™, VaultDNS™, and MeshNest™ protocols.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ffcc00] text-lg">⚡</span>
              <span><strong>Treaty-Linked Economy:</strong> Includes a Royalty-Linked License from Fruitful Global's Treaty Grid.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#ffcc00] text-lg">⚡</span>
              <span><strong>ClaimRoot™ Verified:</strong> Secure, traceable site ownership for every deployed scroll.</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => {
            if (!timerExpired) {
              const fileManager = document.getElementById('file-manager');
              if (fileManager) {
                fileManager.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }}
          disabled={timerExpired}
          className={`inline-flex items-center gap-3 px-10 py-4 text-lg font-extrabold rounded-xl transition-all ${
            timerExpired
              ? 'bg-gray-500 cursor-not-allowed opacity-60'
              : 'bg-[#ffcc00] text-black hover:bg-[#ffe066] hover:transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl'
          }`}
        >
          <ArrowRight className="w-5 h-5" />
          Enter Fruitful | CodeNest™
        </button>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-8 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all ${
            isDragging
              ? 'border-[#ffcc00] bg-[rgba(255,204,0,0.15)] shadow-lg transform scale-105'
              : 'border-[#ffcc00] bg-[rgba(255,204,0,0.05)]'
          }`}
        >
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <CloudUpload className="w-8 h-8" />
            <p className="text-lg">Drag & Drop HTML/PDF here to Omnidrop into CodeNest™</p>
            <p className="text-sm text-gray-500">(Adheres to the 3-minute rule for rapid ingestion)</p>
          </div>
        </div>

        <footer className="mt-12 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-4">
            <span>Powered by Fruitful Global | ScrollSynced | Vault-Verified</span>
            <span className="text-gray-700">•</span>
            <a href="/admin/login" className="text-gray-600 hover:text-[#ffcc00] transition-colors">Admin</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
