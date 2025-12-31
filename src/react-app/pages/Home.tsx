import { useState } from 'react';
import { Link } from 'react-router';
import ParticleCanvas from '@/react-app/components/ParticleCanvas';
import HotStackHero from '@/react-app/components/HotStackHero';
import FileManager from '@/react-app/components/FileManager';

export default function Home() {
  const [timerExpired, setTimerExpired] = useState(false);

  const handleTimerComplete = () => {
    setTimerExpired(true);
  };

  const handleFilesDrop = async (files: FileList) => {
    const file = files[0];
    
    // Check file type
    if (file.type !== 'text/html' && file.type !== 'application/pdf') {
      alert('Only HTML or PDF files can be omnidropped.');
      return;
    }

    // Upload the file
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      alert(`"${file.name}" is being omnidropped into CodeNest™! (Simulated rapid ingestion adhering to 3-minute rule)`);
      
      // Scroll to file manager
      setTimeout(() => {
        const fileManager = document.getElementById('file-manager');
        if (fileManager) {
          fileManager.scrollIntoView({ behavior: 'smooth' });
        }
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to omnidrop file. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1c] overflow-hidden">
      <ParticleCanvas />
      
      {/* Fruitful Branding Header */}
      <div className="relative z-20 bg-gradient-to-r from-yellow-600/10 to-teal-600/10 border-b border-white/10 py-3">
        <div className="container mx-auto px-6 flex items-center justify-center gap-4">
          <img 
            src="https://019b707b-b33f-7a1c-a703-57213a84f433.mochausercontent.com/Billboard_retail_respitory_in_seedwave.png"
            alt="Fruitful HOME"
            className="h-16 w-auto object-contain hover:scale-105 transition-transform"
          />
        </div>
      </div>
      
      {/* Navigation Bar */}
      <nav className="relative z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-white">
            Fruitful | CodeNest™
          </Link>
          <div className="flex gap-4">
            <Link
              to="/brands"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🔍 Brands
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              👤 Dashboard
            </Link>
            <Link
              to="/drop-zone"
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🔥 Drop
            </Link>
            <Link
              to="/ecosystem"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🌐 Ecosystem
            </Link>
            <Link
              to="/hotstack"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              ⚡ HotStack
            </Link>
            <Link
              to="/mocha-integration"
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🔗 Integration
            </Link>
            <Link
              to="/cart"
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🛒 Cart
            </Link>
            <Link
              to="/scroll"
              className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              📜 Scroll
            </Link>
            <Link
              to="/faa-global"
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🌍 FAA Global
            </Link>
            <a
              href="/admin/login"
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-300 text-sm"
            >
              Admin
            </a>
          </div>
        </div>
      </nav>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center py-8">
          <HotStackHero
            onTimerComplete={handleTimerComplete}
            timerExpired={timerExpired}
            onFilesDrop={handleFilesDrop}
          />
        </div>

        <div id="file-manager" className="pb-12">
          <FileManager />
        </div>

        {/* Fruitful Community Section */}
        <div className="pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
              <div className="space-y-6">
                <h2 className="text-4xl font-black text-white flex items-center gap-2">
                  <span>🍎</span> Proudly Fruitful™
                </h2>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
                    <h3 className="text-lg font-bold text-white mb-2">Fresh & Thoughtful</h3>
                    <p className="text-gray-300 text-sm">
                      Just like our doggy drinking station provides fresh water, Fruitful delivers fresh solutions for your digital needs.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
                    <h3 className="text-lg font-bold text-white mb-2">Community First</h3>
                    <p className="text-gray-300 text-sm">
                      From retail to ecosystem management, we build tools that serve your community with care and creativity.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <img 
                  src="https://019b707b-b33f-7a1c-a703-57213a84f433.mochausercontent.com/RIDDLE.jpg"
                  alt="Fruitful Community"
                  className="w-full h-auto rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
