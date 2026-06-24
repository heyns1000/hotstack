import { useState } from 'react';
import { Link } from 'react-router';
import ParticleCanvas from '@/react-app/components/ParticleCanvas';
import HotStackHero from '@/react-app/components/HotStackHero';
import FileManager from '@/react-app/components/FileManager';

const PRIMARY_NAV = [
  { to: '/drop-zone', label: '🔥 Drop', gradient: 'from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700' },
  { to: '/brands',   label: '🔍 Brands', gradient: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' },
  { to: '/dashboard', label: '👤 Dashboard', gradient: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' },
  { to: '/hotstack', label: '⚡ HotStack', gradient: 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' },
];

const SECONDARY_NAV = [
  { to: '/ecosystem', label: '🌐 Ecosystem' },
  { to: '/scroll', label: '📜 Scroll' },
  { to: '/cart', label: '🛒 Cart' },
  { to: '/faa-global', label: '🌍 FAA Global' },
  { to: '/mocha-integration', label: '🔗 Integration' },
  { to: '/api-demos', label: '🧪 API Demos' },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1a1a1c] overflow-hidden">
      <ParticleCanvas />

      <div className="relative z-20 bg-gradient-to-r from-yellow-600/10 to-teal-600/10 border-b border-white/10 py-3">
        <div className="container mx-auto px-6 flex items-center justify-center">
          <img
            src="https://019b707b-b33f-7a1c-a703-57213a84f433.mochausercontent.com/Billboard_retail_respitory_in_seedwave.png"
            alt="Fruitful HOME"
            className="h-16 w-auto object-contain hover:scale-105 transition-transform"
          />
        </div>
      </div>

      <nav className="relative z-20 px-4 py-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="text-xl font-bold text-white whitespace-nowrap shrink-0">
            Fruitful | CodeNest™
          </Link>

          <div className="hidden md:flex items-center gap-2 flex-wrap">
            {PRIMARY_NAV.map(({ to, label, gradient }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 bg-gradient-to-r ${gradient} text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm whitespace-nowrap`}
              >
                {label}
              </Link>
            ))}
            <div className="relative group">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-300 text-sm border border-white/20">
                More &#9660;
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {SECONDARY_NAV.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 first:rounded-t-xl last:rounded-b-xl transition-colors"
                  >
                    {label}
                  </Link>
                ))}
                <div className="border-t border-white/10" />
                <a
                  href="/admin/login"
                  className="block px-4 py-3 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-b-xl transition-colors"
                >
                  🔐 Admin
                </a>
              </div>
            </div>
          </div>

          <button
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-4 px-4 pb-4 flex flex-col gap-2">
            {[...PRIMARY_NAV.map(({ to, label }) => ({ to, label })), ...SECONDARY_NAV].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-white bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
              >
                {label}
              </Link>
            ))}
            <a
              href="/admin/login"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
            >
              🔐 Admin
            </a>
          </div>
        )}
      </nav>

      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center py-8">
          <HotStackHero />
        </div>

        <div id="file-manager" className="pb-12">
          <FileManager />
        </div>

        <div className="pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
              <div className="space-y-6">
                <h2 className="text-4xl font-black text-white flex items-center gap-2">
                  <span>🍎</span> Proudly Fruitful™
                </h2>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
                    <h3 className="text-lg font-bold text-white mb-2">Fresh &amp; Thoughtful</h3>
                    <p className="text-gray-300 text-sm">
                      Fruitful delivers fresh solutions for your digital needs — zero-signup, live in minutes.
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
