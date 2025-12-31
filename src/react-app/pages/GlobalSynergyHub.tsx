import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useCurrency } from '../hooks/useCurrency';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Canvas animation component
function PulseCanvas({ id, type }: { id: string; type: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId: number;
    let time = 0;

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(10, 10, 13, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.02;

      if (type === 'concentric') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const numWaves = 20;

        for (let i = 0; i < numWaves; i++) {
          const radius = (time * 12 + i * 12) % (Math.max(canvas.width, canvas.height) / 1.2) + 5;
          const hue = (i * 20 + time * 100) % 360;
          ctx.beginPath();
          ctx.strokeStyle = `hsla(${hue}, 95%, 80%, ${0.95 - (radius / (Math.max(canvas.width, canvas.height) / 1.2))})`;
          ctx.lineWidth = 4;
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (type === 'rhythmic') {
        const numLines = 40;
        const amplitude = canvas.height / 2.5;

        for (let i = 0; i < numLines; i++) {
          ctx.beginPath();
          const offset = i * (Math.PI * 2 / numLines);
          const colorHue = (time * 200 + i * 15) % 360;
          ctx.strokeStyle = `hsla(${colorHue}, 95%, 75%, 0.9)`;
          ctx.lineWidth = 2.5;

          for (let x = 0; x < canvas.width; x += 2) {
            const y = Math.sin(x * 0.1 + time + offset) * (amplitude * (Math.sin(time * 0.3 + i * 0.15) * 0.5 + 0.5)) + canvas.height / 2;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (type === 'hyperspace') {
        const gridSpacing = 25;
        const lineCountX = Math.ceil(canvas.width / gridSpacing);
        const lineCountY = Math.ceil(canvas.height / gridSpacing);
        const colorProgress = (Math.sin(time * 0.8) + 1) / 2;
        const r = Math.floor(0 + colorProgress * 0);
        const g = Math.floor(123 + colorProgress * (227 - 123));
        const b = Math.floor(255 + colorProgress * (147 - 255));
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.7 + colorProgress * 0.3})`;
        ctx.lineWidth = 1.5;

        for (let i = 0; i <= lineCountY; i++) {
          const y = i * gridSpacing;
          ctx.beginPath();
          ctx.moveTo(0, y + Math.sin(time + y * 0.03) * 20);
          ctx.lineTo(canvas.width, y + Math.sin(time + y * 0.03) * 20);
          ctx.stroke();
        }

        for (let i = 0; i <= lineCountX; i++) {
          const x = i * gridSpacing;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(time + x * 0.03) * 20, 0);
          ctx.lineTo(x + Math.cos(time + x * 0.03) * 20, canvas.height);
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [type]);

  return <canvas ref={canvasRef} id={id} className="w-full h-full" />;
}

// Node Pulse Chart component
function NodePulseChart() {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const dataPoints = 50;
    const labels = Array.from({ length: dataPoints }, (_, i) => `Tick ${i + 1}`);
    const coreNodeData = Array.from({ length: dataPoints }, (_, i) => 
      Math.floor(Math.max(0, 50 + (i * 1.5) + (Math.random() - 0.5) * 40))
    );
    const arrayCountData = Array.from({ length: dataPoints }, (_, i) => 
      Math.floor(Math.max(0, 100 + (i * 2) + (Math.random() - 0.5) * 60))
    );
    const repoInfiltrationData = Array.from({ length: dataPoints }, (_, i) => 
      Math.floor(Math.max(0, 10 + (i * 0.8) + (Math.random() - 0.5) * 20))
    );

    setChartData({
      labels,
      datasets: [
        {
          label: 'Core Nodes (Thousands)',
          data: coreNodeData,
          borderColor: 'rgba(0, 227, 147, 0.9)',
          backgroundColor: 'rgba(0, 227, 147, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2
        },
        {
          label: 'Array Counts (Hundreds)',
          data: arrayCountData,
          borderColor: 'rgba(0, 123, 255, 0.9)',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2
        },
        {
          label: 'Repo Infiltrations',
          data: repoInfiltrationData,
          borderColor: 'rgba(255, 77, 77, 0.9)',
          backgroundColor: 'rgba(255, 77, 77, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2
        }
      ]
    });

    const interval = setInterval(() => {
      setChartData((prev: any) => {
        if (!prev) return prev;
        
        const newData = { ...prev };
        newData.datasets = prev.datasets.map((dataset: any) => {
          const newDataset = { ...dataset };
          const lastValue = dataset.data[dataset.data.length - 1];
          const newValue = Math.floor(Math.max(0, lastValue + (Math.random() - 0.5) * 30));
          
          newDataset.data = [...dataset.data.slice(1), newValue];
          return newDataset;
        });
        
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: { display: false },
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    },
    plugins: {
      legend: { labels: { color: 'rgba(255, 255, 255, 0.9)' } }
    }
  };

  if (!chartData) return <div className="text-white">Loading chart...</div>;

  return <Line data={chartData} options={options} />;
}

export default function GlobalSynergyHub() {
  const { formatPrice } = useCurrency();
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqLoading, setFaqLoading] = useState(false);
  const [spotifyTracks, setSpotifyTracks] = useState<any[]>([]);
  const [spotifyMessage, setSpotifyMessage] = useState('');
  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [conversionResult, setConversionResult] = useState('');

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'ZAR'];

  const exchangeRates: Record<string, Record<string, number>> = {
    USD: { EUR: 0.92, GBP: 0.79, JPY: 157.80, AUD: 1.50, CAD: 1.37, CHF: 0.90, CNY: 7.26, ZAR: 18.25 },
    EUR: { USD: 1.08, GBP: 0.86, JPY: 171.00, AUD: 1.63, CAD: 1.48, CHF: 0.98, CNY: 7.87, ZAR: 19.80 },
    GBP: { USD: 1.27, EUR: 1.16, JPY: 198.80, AUD: 1.90, CAD: 1.73, CHF: 1.15, CNY: 9.15, ZAR: 23.00 },
    JPY: { USD: 0.0063, EUR: 0.0058, GBP: 0.0050, AUD: 0.0095, CAD: 0.0087, CHF: 0.0057, CNY: 0.046, ZAR: 0.11 },
    AUD: { USD: 0.67, EUR: 0.61, GBP: 0.53, JPY: 105.00, CAD: 0.92, CHF: 0.60, CNY: 4.80, ZAR: 12.10 },
    CAD: { USD: 0.73, EUR: 0.67, GBP: 0.58, JPY: 115.00, AUD: 1.09, CHF: 0.66, CNY: 5.29, ZAR: 13.30 },
    CHF: { USD: 1.11, EUR: 1.02, GBP: 0.87, JPY: 174.00, AUD: 1.65, CAD: 1.51, CNY: 8.00, ZAR: 20.15 },
    CNY: { USD: 0.14, EUR: 0.13, GBP: 0.11, JPY: 21.60, AUD: 0.21, CAD: 0.19, CHF: 0.12, ZAR: 2.51 },
    ZAR: { USD: 0.055, EUR: 0.050, GBP: 0.043, JPY: 8.90, AUD: 0.083, CAD: 0.075, CHF: 0.049, CNY: 0.39 }
  };

  const handleConvertCurrency = () => {
    if (fromCurrency === toCurrency) {
      setConversionResult(`${amount.toFixed(2)} ${fromCurrency} = ${amount.toFixed(2)} ${toCurrency}`);
      return;
    }

    const rate = exchangeRates[fromCurrency]?.[toCurrency];
    if (rate) {
      const converted = amount * rate;
      setConversionResult(`${amount.toFixed(2)} ${fromCurrency} = ${converted.toFixed(2)} ${toCurrency}`);
    } else {
      setConversionResult('Conversion rate not available');
    }
  };

  const handleGetTopTracks = async () => {
    setSpotifyMessage('Fetching your top tracks...');
    try {
      const response = await fetch('/api/spotify/top-tracks');
      const data = await response.json();
      
      if (response.ok && data.items) {
        setSpotifyTracks(data.items);
        setSpotifyMessage('Top 5 tracks fetched successfully!');
      } else {
        setSpotifyMessage(data.error || 'Failed to fetch tracks');
        setSpotifyTracks([]);
      }
    } catch (error) {
      setSpotifyMessage('Network error fetching tracks');
      setSpotifyTracks([]);
    }
  };

  const handleGetFaqAnswer = async () => {
    if (!faqQuestion.trim()) {
      setFaqAnswer('Please enter a question');
      return;
    }

    setFaqLoading(true);
    setFaqAnswer('');

    try {
      const response = await fetch('/api/ai/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: faqQuestion })
      });

      const data = await response.json();
      
      if (response.ok && data.answer) {
        setFaqAnswer(data.answer);
      } else {
        setFaqAnswer(data.error || 'Failed to get answer');
      }
    } catch (error) {
      setFaqAnswer('Network error. Please try again.');
    } finally {
      setFaqLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Header - Aligned with app navigation */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="text-4xl">🌐</span>
              <div>
                <h1 className="text-2xl font-black text-white">Global Synergy Hub</h1>
                <p className="text-xs text-gray-400">VaultMesh™ | AgroChain™ Core Protocol</p>
              </div>
            </Link>
            <div className="flex gap-4">
              <Link to="/hotstack" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all">
                HotStack
              </Link>
              <Link to="/drop-zone" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all">
                Drop Zone
              </Link>
              <Link to="/" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all">
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-sm rounded-2xl p-12 border border-purple-500/30 text-center">
            <h2 className="text-5xl font-black text-white mb-4">
              VaultMesh™ | AgroChain™ Core Protocol
            </h2>
            <p className="text-xl text-gray-200 mb-6 max-w-3xl mx-auto">
              Empowering the Agriculture & Biotech sector with advanced automation and data management
            </p>
            <div className="flex gap-4 justify-center">
              <a href="#pricing" className="px-8 py-4 bg-white text-purple-700 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl">
                View Pricing →
              </a>
              <Link to="/drop-zone" className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-xl">
                Upload Files 🔥
              </Link>
            </div>
          </div>
        </section>

        {/* Global Pulse Grid */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">Global Data Pulse & Innovation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden h-64 hover:scale-105 transition-transform">
              <PulseCanvas id="canvas-concentric" type="concentric" />
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden h-64 hover:scale-105 transition-transform">
              <PulseCanvas id="canvas-rhythmic" type="rhythmic" />
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden h-64 hover:scale-105 transition-transform">
              <PulseCanvas id="canvas-hyperspace" type="hyperspace" />
            </div>
          </div>
        </section>

        {/* Key Metrics */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">Our Interstellar Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">🌐</div>
              <h3 className="text-xl font-bold text-white mb-2">Global Node Reach</h3>
              <p className="text-gray-300 text-sm mb-3">Expanding our network across all digital frontiers</p>
              <div className="text-4xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">92%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">🚀</div>
              <h3 className="text-xl font-bold text-white mb-2">Launch Velocity</h3>
              <p className="text-gray-300 text-sm mb-3">Accelerating brands into new market orbits</p>
              <div className="text-4xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">x10.5</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">🌱</div>
              <h3 className="text-xl font-bold text-white mb-2">Seeds Planted</h3>
              <p className="text-gray-300 text-sm mb-3">New projects cultivated within the ecosystem</p>
              <div className="text-4xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">7000+</div>
            </div>
          </div>
        </section>

        {/* Node Pulse Chart */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">Node.js Infiltration Pulse</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20" style={{ height: '400px' }}>
            <NodePulseChart />
          </div>
        </section>

        {/* Interactive Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Currency Converter */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <span>💱</span> Global Currency Converter
            </h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4">
                <label className="w-24 text-white font-semibold">Amount:</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                  className="flex-1 px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="w-24 text-white font-semibold">From:</label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="flex-1 px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-24 text-white font-semibold">To:</label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="flex-1 px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleConvertCurrency}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl text-white"
            >
              Convert
            </button>
            {conversionResult && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/40 rounded-lg text-center">
                <div className="text-2xl font-bold text-white">{conversionResult}</div>
              </div>
            )}
          </div>

          {/* AI FAQ Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <span>🤖</span> AI Help & FAQ
            </h2>
            <p className="text-gray-300 mb-4 text-sm">
              Ask your question about AgroChain™, Banimal Loop™ or FAA.zone
            </p>
            <div className="space-y-4">
              <textarea
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="e.g., What is the core protocol of AgroChain™?"
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white min-h-[100px] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
              <button
                onClick={handleGetFaqAnswer}
                disabled={faqLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-lg transition-all disabled:opacity-50 transform hover:scale-105 shadow-xl text-white"
              >
                {faqLoading ? 'Generating answer...' : 'Get Answer ✨'}
              </button>
              {faqAnswer && (
                <div className="p-4 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/40 rounded-lg whitespace-pre-wrap text-gray-200 text-sm max-h-60 overflow-y-auto">
                  {faqAnswer}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spotify Integration */}
        <section className="mb-16">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
            <h2 className="text-4xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
              <span>🎵</span> Spotify Music Pulse
            </h2>
            <p className="text-center text-gray-300 mb-6">
              Connect to your Spotify account to discover your top tracks
            </p>
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={handleGetTopTracks}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition-all flex items-center gap-2 transform hover:scale-105 shadow-xl"
              >
                🎵 Get My Top 5 Tracks
              </button>
            </div>
            {spotifyMessage && (
              <div className="mb-6 p-4 bg-black/30 border border-white/20 rounded-lg text-center text-gray-200">
                {spotifyMessage}
              </div>
            )}
            {spotifyTracks.length > 0 && (
              <div className="bg-black/30 p-6 rounded-xl border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-4">Your Top Tracks:</h3>
                <ul className="space-y-3">
                  {spotifyTracks.map((track, idx) => (
                    <li key={idx} className="border-b border-white/10 pb-3 last:border-0">
                      <strong className="text-white">{track.name}</strong>
                      <span className="text-gray-400"> by {track.artists.map((a: any) => a.name).join(', ')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">Flexible Pricing for Every Operation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 hover:scale-105 transition-transform">
              <h3 className="text-2xl font-bold text-white mb-2">🌱 Starter</h3>
              <div className="text-4xl font-black mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                {formatPrice(30.52)}
              </div>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>✓ Basic API Access</li>
                <li>✓ Standard Analytics</li>
                <li>✓ Community Support</li>
                <li>✓ Up to 5 Users</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-600/30 to-indigo-600/30 p-8 rounded-xl border-2 border-purple-500 hover:scale-105 transition-transform">
              <div className="text-xs font-bold text-purple-300 mb-2">MOST POPULAR</div>
              <h3 className="text-2xl font-bold text-white mb-2">🌱 Pro</h3>
              <div className="text-4xl font-black mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                {formatPrice(76.30)}
              </div>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>✓ Advanced API Access</li>
                <li>✓ Premium Analytics</li>
                <li>✓ Priority Support</li>
                <li>✓ Unlimited Users</li>
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 hover:scale-105 transition-transform">
              <h3 className="text-2xl font-bold text-white mb-2">🌱 Enterprise</h3>
              <div className="text-4xl font-black mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                {formatPrice(152.60)}
              </div>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>✓ All Business Features</li>
                <li>✓ Account Manager</li>
                <li>✓ 24/7 Phone Support</li>
                <li>✓ On-site Training</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 p-8 rounded-xl border border-green-500/50 hover:scale-105 transition-transform">
              <h3 className="text-2xl font-bold text-white mb-2">🐑 Banimal Loop</h3>
              <div className="text-4xl font-black mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                {formatPrice(499.00)}
              </div>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>✓ Global Impact Automation</li>
                <li>✓ Creature Data Synthesis</li>
                <li>✓ Baobab Network Integration</li>
                <li>✓ Ethical Loop Verification</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 backdrop-blur-sm rounded-2xl p-8 border border-indigo-500/30">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Explore More Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/hotstack" className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-all text-center group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">⚡</div>
                <h3 className="text-white font-bold text-lg mb-2">HotStack Admin</h3>
                <p className="text-gray-300 text-sm">Manage your ecosystem sectors and brands</p>
              </Link>
              <Link to="/drop-zone" className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-all text-center group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🔥</div>
                <h3 className="text-white font-bold text-lg mb-2">HotStack Drop Zone</h3>
                <p className="text-gray-300 text-sm">AI-powered file analysis and VaultMesh</p>
              </Link>
              <Link to="/mocha-integration" className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-all text-center group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🔗</div>
                <h3 className="text-white font-bold text-lg mb-2">App Integration</h3>
                <p className="text-gray-300 text-sm">Webhook streaming and data sync</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Fruitful Branding */}
        <section className="mb-16">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Proudly Powered by Fruitful™</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <img 
                src="https://019b707b-b33f-7a1c-a703-57213a84f433.mochausercontent.com/Billboard_retail_respitory_in_seedwave.png"
                alt="Fruitful HOME"
                className="w-full h-auto rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              />
              <img 
                src="https://019b707b-b33f-7a1c-a703-57213a84f433.mochausercontent.com/RIDDLE.jpg"
                alt="Fruitful Community"
                className="w-full h-auto rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-center text-gray-300 mt-6 text-lg">
              Fresh solutions for your digital ecosystem 🍎
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-white/10">
          <h3 className="text-3xl font-black text-white mb-3">
            <span className="text-white">Banimal™:</span>
            <span className="text-blue-400"> 🐑 Kind Creatures. Global Impact.</span>
          </h3>
          <p className="text-gray-300 mb-4">
            Discover Banimal's world of thoughtful baby essentials & innovative lighting.
          </p>
          <p className="text-sm text-gray-500">
            &copy; 2025 Banimal™ & Fruitful™. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
