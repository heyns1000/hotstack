import { useState, useEffect, useRef } from 'react';
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

    // Set canvas size
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

    // Update chart data periodically
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

// Main component
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
    <div className="min-h-screen bg-[#1a1a1c] text-white">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-br from-purple-600 to-purple-800">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-6xl font-extrabold mb-6">
            VaultMesh™ | AgroChain™ Core Protocol
          </h1>
          <p className="text-2xl mb-8 opacity-90">
            AgroChain™ is a powerful FAA.zone™ framework empowering the Agriculture & Biotech sector with advanced automation and data management.
          </p>
          <a href="#pricing" className="inline-block bg-white text-purple-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition">
            View Pricing →
          </a>
        </div>
      </section>

      {/* Global Pulse Grid */}
      <section className="py-16 px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Global Data Pulse & Innovation</h2>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#1c1c21] border border-[#3a3a42] rounded-xl overflow-hidden h-64">
            <PulseCanvas id="canvas-concentric" type="concentric" />
          </div>
          <div className="bg-[#1c1c21] border border-[#3a3a42] rounded-xl overflow-hidden h-64">
            <PulseCanvas id="canvas-rhythmic" type="rhythmic" />
          </div>
          <div className="bg-[#1c1c21] border border-[#3a3a42] rounded-xl overflow-hidden h-64">
            <PulseCanvas id="canvas-hyperspace" type="hyperspace" />
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 px-4 border-t border-[#3a3a3e]">
        <h2 className="text-4xl font-bold text-center mb-12">Our Interstellar Impact</h2>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#2a2a2e] p-8 rounded-xl border border-[#3a3a3e] text-center hover:transform hover:-translate-y-2 transition">
            <div className="text-6xl mb-4">🌐</div>
            <h3 className="text-2xl font-bold mb-2">Global Node Reach</h3>
            <p className="text-gray-400 mb-4">Expanding our network across all digital frontiers</p>
            <div className="text-4xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">92%</div>
          </div>
          <div className="bg-[#2a2a2e] p-8 rounded-xl border border-[#3a3a3e] text-center hover:transform hover:-translate-y-2 transition">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold mb-2">Launch Velocity</h3>
            <p className="text-gray-400 mb-4">Accelerating brands into new market orbits</p>
            <div className="text-4xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">x10.5</div>
          </div>
          <div className="bg-[#2a2a2e] p-8 rounded-xl border border-[#3a3a3e] text-center hover:transform hover:-translate-y-2 transition">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-2xl font-bold mb-2">Seeds Planted</h3>
            <p className="text-gray-400 mb-4">New projects cultivated within the ecosystem</p>
            <div className="text-4xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">7000+</div>
          </div>
        </div>
      </section>

      {/* Currency Converter */}
      <section className="py-16 px-4 border-t border-[#3a3a3e]">
        <div className="max-w-3xl mx-auto bg-[#1c1c21] p-8 rounded-xl border border-[#3a3a42]">
          <h2 className="text-3xl font-bold mb-6 text-center">Global Currency Converter</h2>
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="w-24">Amount:</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="flex-1 px-4 py-2 bg-[#2a2a30] border border-[#3a3a3e] rounded-lg text-white"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-24">From:</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#2a2a30] border border-[#3a3a3e] rounded-lg text-white"
              >
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-24">To:</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#2a2a30] border border-[#3a3a3e] rounded-lg text-white"
              >
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleConvertCurrency}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full font-bold transition"
          >
            Convert
          </button>
          {conversionResult && (
            <div className="mt-6 text-xl font-semibold text-center">{conversionResult}</div>
          )}
        </div>
      </section>

      {/* Spotify Integration */}
      <section className="py-16 px-4 border-t border-[#3a3a3e]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8">Spotify Music Pulse</h2>
          <p className="text-center text-gray-400 mb-8">
            Connect to your Spotify account to discover your top tracks
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={handleGetTopTracks}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-full font-semibold transition flex items-center gap-2"
            >
              🎵 Get My Top 5 Tracks
            </button>
          </div>
          {spotifyMessage && (
            <div className="mb-6 p-4 bg-[#1c1c21] border border-[#3a3a42] rounded-lg text-center">
              {spotifyMessage}
            </div>
          )}
          {spotifyTracks.length > 0 && (
            <div className="bg-[#1c1c21] p-6 rounded-xl border border-[#3a3a42]">
              <h3 className="text-2xl font-bold mb-4">Your Top Tracks:</h3>
              <ul className="space-y-2">
                {spotifyTracks.map((track, idx) => (
                  <li key={idx} className="border-b border-gray-700 pb-2">
                    <strong>{track.name}</strong> by {track.artists.map((a: any) => a.name).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Node Pulse Chart */}
      <section className="py-16 px-4 border-t border-[#3a3a3e]">
        <h2 className="text-4xl font-bold text-center mb-8">Node.js Infiltration Pulse</h2>
        <div className="max-w-7xl mx-auto bg-[#0a0a0d] p-6 rounded-xl border border-[#3a3a3e]" style={{ height: '400px' }}>
          <NodePulseChart />
        </div>
      </section>

      {/* AI FAQ Section */}
      <section className="py-16 px-4 border-t border-[#3a3a3e]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">🤖 AI Help & FAQ Answers</h2>
          <p className="text-center text-gray-400 mb-8">
            Ask your question about AgroChain™, Banimal Loop™ or FAA.zone
          </p>
          <div className="space-y-4">
            <textarea
              value={faqQuestion}
              onChange={(e) => setFaqQuestion(e.target.value)}
              placeholder="e.g., What is the core protocol of AgroChain™?"
              className="w-full px-4 py-3 bg-[#3a3a3e] border border-[#3a3a3e] rounded-lg text-white min-h-[100px]"
            />
            <button
              onClick={handleGetFaqAnswer}
              disabled={faqLoading}
              className="w-full py-3 bg-purple-700 hover:bg-purple-800 rounded-full font-bold transition disabled:opacity-50"
            >
              {faqLoading ? 'Generating answer...' : 'Get Answer ✨'}
            </button>
            {faqAnswer && (
              <div className="mt-6 p-6 bg-[#1c1c21] border border-[#3a3a42] rounded-lg whitespace-pre-wrap">
                {faqAnswer}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 border-t border-[#3a3a3e]">
        <h2 className="text-4xl font-bold text-center mb-12">Flexible Pricing for Every Operation</h2>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#2a2a2e] p-8 rounded-xl border border-[#3a3a3e]">
            <h3 className="text-2xl font-bold mb-2">🌱 Starter Package</h3>
            <div className="text-4xl font-black mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              {formatPrice(30.52)}
            </div>
            <ul className="space-y-2 text-sm">
              <li>✓ Basic API Access</li>
              <li>✓ Standard Analytics</li>
              <li>✓ Community Support</li>
              <li>✓ Up to 5 Users</li>
            </ul>
          </div>
          <div className="bg-[#3c3c42] p-8 rounded-xl border-2 border-purple-500">
            <h3 className="text-2xl font-bold mb-2">🌱 Pro Package</h3>
            <div className="text-4xl font-black mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              {formatPrice(76.30)}
            </div>
            <ul className="space-y-2 text-sm">
              <li>✓ Advanced API Access</li>
              <li>✓ Premium Analytics</li>
              <li>✓ Priority Support</li>
              <li>✓ Unlimited Users</li>
            </ul>
          </div>
          <div className="bg-[#222225] p-8 rounded-xl border border-[#4a4a50]">
            <h3 className="text-2xl font-bold mb-2">🌱 Enterprise</h3>
            <div className="text-4xl font-black mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              {formatPrice(152.60)}
            </div>
            <ul className="space-y-2 text-sm">
              <li>✓ All Business Features</li>
              <li>✓ Account Manager</li>
              <li>✓ 24/7 Phone Support</li>
              <li>✓ On-site Training</li>
            </ul>
          </div>
          <div className="bg-[#1f3d2f] p-8 rounded-xl border border-[#3a5c3e]">
            <h3 className="text-2xl font-bold mb-2">🐑 Banimal Loop</h3>
            <div className="text-4xl font-black mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              {formatPrice(499.00)}
            </div>
            <ul className="space-y-2 text-sm">
              <li>✓ Global Impact Automation</li>
              <li>✓ Creature Data Synthesis</li>
              <li>✓ Baobab Network Integration</li>
              <li>✓ Ethical Loop Verification</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[#3a3a3e] bg-[#050508]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">
            <span className="text-white">Banimal™:</span><br />
            <span className="text-blue-400">🐑 Kind Creatures. Global Impact.</span>
          </h1>
          <p className="text-gray-300 mb-6">
            Discover Banimal's world of thoughtful baby essentials & innovative lighting.
          </p>
          <p className="text-sm text-gray-500 mt-8">
            &copy; 2025 Banimal™. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
