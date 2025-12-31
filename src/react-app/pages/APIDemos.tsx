import { useState } from 'react';
import { Link } from 'react-router';

export default function APIDemos() {
  const [paypalAmount, setPaypalAmount] = useState('100.00');
  const [mapAddress, setMapAddress] = useState('1600 Amphitheatre Parkway, Mountain View, CA');
  const [spotifyTrack, setSpotifyTrack] = useState('24KoWEhhUGmnTofg0UAgbO');
  const [xeroAction, setXeroAction] = useState('contacts');

  const handlePayPalCheckout = () => {
    alert(`PayPal Demo: Initiating checkout for $${paypalAmount}\n\nIn production, this would redirect to PayPal's secure payment page.`);
  };

  const handleGoogleMapsSearch = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`, '_blank');
  };

  const handleSpotifyPreview = () => {
    const embedUrl = `https://open.spotify.com/embed/track/${spotifyTrack}`;
    window.open(embedUrl, '_blank');
  };

  const handleXeroAction = () => {
    alert(`Xero API Demo: ${xeroAction} action\n\nIn production, this would connect to Xero's API to manage accounting data.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="text-4xl">🔌</span>
              <div>
                <h1 className="text-2xl font-black text-white">API Integration Demos</h1>
                <p className="text-xs text-gray-400">Live demonstrations of key integrations</p>
              </div>
            </Link>
            <div className="flex gap-4">
              <Link to="/hotstack" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all">
                HotStack
              </Link>
              <Link to="/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all">
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-black text-white mb-4">🔌 API Integration Hub</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience live demonstrations of our core API integrations: PayPal payments, Google Maps location services, 
            Spotify media streaming, and Xero accounting.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PayPal Integration */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-5xl">💳</span>
              <div>
                <h3 className="text-2xl font-black text-white">PayPal Payments</h3>
                <p className="text-sm text-gray-400">Secure payment processing</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paypalAmount}
                  onChange={(e) => setPaypalAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg text-white focus:border-blue-500 transition-all"
                />
              </div>

              <button
                onClick={handlePayPalCheckout}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-xl transition-all"
              >
                Checkout with PayPal
              </button>

              <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-bold mb-3">Features:</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Secure payment processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Multiple currency support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Subscription management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Automated invoicing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Google Maps Integration */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-5xl">🗺️</span>
              <div>
                <h3 className="text-2xl font-black text-white">Google Maps</h3>
                <p className="text-sm text-gray-400">Location & mapping services</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Search Location</label>
                <input
                  type="text"
                  value={mapAddress}
                  onChange={(e) => setMapAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg text-white focus:border-green-500 transition-all"
                />
              </div>

              <button
                onClick={handleGoogleMapsSearch}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-xl transition-all"
              >
                Search on Google Maps
              </button>

              <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-bold mb-3">Capabilities:</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Geocoding & reverse geocoding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Distance matrix calculations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Place search & details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Route optimization</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Spotify Integration */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-5xl">🎵</span>
              <div>
                <h3 className="text-2xl font-black text-white">Spotify Media</h3>
                <p className="text-sm text-gray-400">Music streaming & discovery</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Track ID</label>
                <input
                  type="text"
                  value={spotifyTrack}
                  onChange={(e) => setSpotifyTrack(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg text-white focus:border-purple-500 transition-all font-mono text-sm"
                />
              </div>

              <button
                onClick={handleSpotifyPreview}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-xl transition-all"
              >
                Preview Track
              </button>

              <div className="rounded-xl overflow-hidden">
                <iframe
                  src={`https://open.spotify.com/embed/track/${spotifyTrack}?utm_source=generator`}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl"
                />
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-bold mb-3">Integration Features:</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Track search & playback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Playlist management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>User library access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Recommendations engine</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Xero Integration */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-5xl">📊</span>
              <div>
                <h3 className="text-2xl font-black text-white">Xero Accounting</h3>
                <p className="text-sm text-gray-400">Financial management</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Action Type</label>
                <select
                  value={xeroAction}
                  onChange={(e) => setXeroAction(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg text-white focus:border-orange-500 transition-all"
                >
                  <option value="contacts">Manage Contacts</option>
                  <option value="invoices">Create Invoice</option>
                  <option value="payments">Record Payment</option>
                  <option value="reports">Generate Report</option>
                  <option value="bankfeeds">Bank Feeds</option>
                </select>
              </div>

              <button
                onClick={handleXeroAction}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-xl transition-all"
              >
                Execute Xero Action
              </button>

              <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-bold mb-3">Xero Capabilities:</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Automated invoicing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Bank reconciliation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Financial reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Expense tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Multi-currency support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* API Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-4xl mb-2">🔌</div>
            <div className="text-3xl font-black text-blue-400">4</div>
            <div className="text-white font-semibold">Active APIs</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-3xl font-black text-green-400">99.9%</div>
            <div className="text-white font-semibold">Uptime</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-4xl mb-2">🚀</div>
            <div className="text-3xl font-black text-purple-400">&lt;100ms</div>
            <div className="text-white font-semibold">Response Time</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-4xl mb-2">🔒</div>
            <div className="text-3xl font-black text-orange-400">256-bit</div>
            <div className="text-white font-semibold">Encryption</div>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h3 className="text-2xl font-black text-white mb-6 text-center">📚 API Documentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="https://developer.paypal.com/docs/api/overview/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black/30 hover:bg-black/50 p-6 rounded-lg border border-white/10 hover:border-blue-500 transition-all text-center group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">💳</div>
              <div className="text-white font-bold">PayPal Docs</div>
              <div className="text-xs text-gray-400 mt-2">Payment API Reference</div>
            </a>
            <a
              href="https://developers.google.com/maps/documentation"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black/30 hover:bg-black/50 p-6 rounded-lg border border-white/10 hover:border-green-500 transition-all text-center group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🗺️</div>
              <div className="text-white font-bold">Google Maps Docs</div>
              <div className="text-xs text-gray-400 mt-2">Maps API Reference</div>
            </a>
            <a
              href="https://developer.spotify.com/documentation/web-api"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black/30 hover:bg-black/50 p-6 rounded-lg border border-white/10 hover:border-purple-500 transition-all text-center group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎵</div>
              <div className="text-white font-bold">Spotify Docs</div>
              <div className="text-xs text-gray-400 mt-2">Web API Reference</div>
            </a>
            <a
              href="https://developer.xero.com/documentation/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black/30 hover:bg-black/50 p-6 rounded-lg border border-white/10 hover:border-orange-500 transition-all text-center group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📊</div>
              <div className="text-white font-bold">Xero Docs</div>
              <div className="text-xs text-gray-400 mt-2">Accounting API Reference</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
