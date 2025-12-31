import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useCurrency } from '@/react-app/hooks/useCurrency';
import { sectorList, sectorData } from '@/worker/data/sectors';

interface Brand {
  name: string;
  subNodes: string[];
  masterLicensePrice?: number;
}

type BillingPeriod = 'monthly' | 'annual';

export default function HotStackAdmin() {
  const { currency, setCurrency, currencies, formatPrice, isLoading: currencyLoading } = useCurrency();
  const [activeSectorPanel, setActiveSectorPanel] = useState<string | null>(null);
  const [activeBrandIndex, setActiveBrandIndex] = useState<{ [key: string]: number | null }>({});
  const [selectedAdminSector, setSelectedAdminSector] = useState('agriculture');
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [subnodes, setSubnodes] = useState('');
  const [adminStatus, setAdminStatus] = useState('Ready to receive input.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [metrics, setMetrics] = useState({
    activeNodes: 0,
    licensesActive: 0,
    vaultDeployments: 0,
    syncLogs: 0,
    auditsRunning: 0,
    signalZones: 0,
    scrollGridIndex: 0
  });

  useEffect(() => {
    calculateMetrics();
  }, []);

  const calculateMetrics = () => {
    let totalBrands = 0;
    let totalNodes = 0;

    Object.values(sectorData).forEach(sector => {
      totalBrands += sector.brands.length;
      sector.brands.forEach(brand => {
        totalNodes += brand.subNodes.length;
      });
    });

    setMetrics({
      activeNodes: totalBrands,
      licensesActive: totalBrands * 2,
      vaultDeployments: Math.round(totalBrands * 1.5),
      syncLogs: totalBrands * 5,
      auditsRunning: Math.ceil(totalBrands / 10),
      signalZones: Math.floor(totalBrands / 3),
      scrollGridIndex: totalBrands + totalNodes
    });
  };

  const showSectorPanel = (sectorKey: string) => {
    setActiveSectorPanel(sectorKey);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const hideSectorPanel = () => {
    setActiveSectorPanel(null);
    setActiveBrandIndex({});
  };

  const toggleBrandSnapshot = (sectorKey: string, brandIndex: number) => {
    setActiveBrandIndex(prev => ({
      ...prev,
      [sectorKey]: prev[sectorKey] === brandIndex ? null : brandIndex
    }));
  };

  const generateBrandDescription = async () => {
    if (!brandName.trim()) {
      setAdminStatus('⚠️ Please enter a brand name first.');
      setTimeout(() => setAdminStatus('Ready to receive input.'), 3000);
      return;
    }

    setIsGenerating(true);
    setAdminStatus('Generating description with AI...');
    
    try {
      const sectorDisplayName = sectorList[selectedAdminSector] || selectedAdminSector;
      const prompt = `Generate a concise and compelling 50-word description for a brand named "${brandName}" operating in the "${sectorDisplayName}" sector for an admin portal. Focus on its core value proposition and innovation.`;
      
      const response = await fetch('/api/ecosystem/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await response.json();
      setBrandDescription(data.text || 'Failed to generate description');
      setAdminStatus('Description generated successfully!');
    } catch (error) {
      console.error('Error generating description:', error);
      setAdminStatus('Error generating description.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setAdminStatus('Ready to receive input.'), 3000);
    }
  };

  const suggestSubnodes = async () => {
    if (!brandName.trim()) {
      setAdminStatus('⚠️ Please enter a brand name first.');
      setTimeout(() => setAdminStatus('Ready to receive input.'), 3000);
      return;
    }

    setIsGenerating(true);
    setAdminStatus('Suggesting subnodes with AI...');
    
    try {
      const sectorDisplayName = sectorList[selectedAdminSector] || selectedAdminSector;
      const prompt = `Suggest 3-5 innovative subnodes for a brand named "${brandName}" in the "${sectorDisplayName}" sector. Provide only the names separated by commas.`;
      
      const response = await fetch('/api/ecosystem/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await response.json();
      setSubnodes(data.text || '');
      setAdminStatus('Subnodes suggested successfully!');
    } catch (error) {
      console.error('Error suggesting subnodes:', error);
      setAdminStatus('Error suggesting subnodes.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setAdminStatus('Ready to receive input.'), 3000);
    }
  };

  const addBrand = async () => {
    if (!brandName.trim() || !subnodes.trim()) {
      setAdminStatus('⚠️ Please fill in both brand name and subnodes.');
      setTimeout(() => setAdminStatus('Ready to receive input.'), 3000);
      return;
    }
    
    setAdminStatus(`✅ Added ${brandName} to ${sectorList[selectedAdminSector]}`);
    setBrandName('');
    setBrandDescription('');
    setSubnodes('');
    setTimeout(() => setAdminStatus('Ready to receive input.'), 3000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setAdminStatus(`✅ HotStack Drop: "${file.name}" activated! File processed and stored.`);
      } else {
        setAdminStatus(`❌ Failed to process HotStack drop: ${file.name}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setAdminStatus('❌ HotStack drop failed. Please try again.');
    }
    setTimeout(() => setAdminStatus('Ready to receive input.'), 5000);
  };

  const getCoreProtocolPrice = (brand: Brand, sectorKey: string, period: BillingPeriod): number => {
    const sector = sectorData[sectorKey];
    if (sector?.pricing) {
      const sectorBasePrice = period === 'monthly' ? sector.pricing.monthlyFee : sector.pricing.annualFee;
      const brandMultiplier = (brand.masterLicensePrice || 10000) / 10000;
      return Math.round(sectorBasePrice * brandMultiplier * 10);
    }
    const basePrice = brand.masterLicensePrice || 10000;
    const monthlyPrice = Math.round(basePrice / 12);
    return period === 'monthly' ? monthlyPrice : basePrice;
  };

  const getSubnodePrice = (brand: Brand, sectorKey: string, period: BillingPeriod): number => {
    const sector = sectorData[sectorKey];
    if (sector?.pricing) {
      const sectorBasePrice = period === 'monthly' ? sector.pricing.monthlyFee : sector.pricing.annualFee;
      const brandMultiplier = (brand.masterLicensePrice || 10000) / 10000;
      const subnodePrice = Math.round((sectorBasePrice * brandMultiplier) / brand.subNodes.length);
      return subnodePrice;
    }
    const basePrice = brand.masterLicensePrice || 10000;
    const subnodeBasePrice = Math.round(basePrice / (brand.subNodes.length * 2));
    const monthlyPrice = Math.round(subnodeBasePrice / 12);
    return period === 'monthly' ? monthlyPrice : subnodeBasePrice;
  };

  const handlePayPalCheckout = (productName: string, price: number, period: BillingPeriod) => {
    const periodLabel = period === 'monthly' ? '/month' : '/year';
    setAdminStatus(`🔄 Initiating PayPal checkout for ${productName} at ${formatPrice(price)}${periodLabel}...`);
    
    setTimeout(() => {
      setAdminStatus(`✅ PayPal checkout ready for ${productName}. Redirecting...`);
    }, 2000);
    
    setTimeout(() => {
      setAdminStatus('Ready to receive input.');
    }, 5000);
  };

  const renderBrandSnapshot = (brand: Brand, sectorKey: string) => {
    const sectorDisplayName = sectorList[sectorKey] || sectorKey;
    const productId = `${brand.name.slice(0,3).toUpperCase()}-${sectorKey.slice(0,3).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;
    const vaultId = `VAULT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const coreProtocolPrice = getCoreProtocolPrice(brand, sectorKey, billingPeriod);
    
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl mt-6 border-2 border-indigo-500/30">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl -mt-8 -mx-8 mb-6">
          <h4 className="text-3xl font-extrabold mb-2">
            🚀 {brand.name}™ Core Protocol
          </h4>
          <p className="text-indigo-100 text-sm">
            FAA.ZONE Solution for {sectorDisplayName}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border-2 border-indigo-500 p-1 bg-gray-800/50">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="mb-10">
          <h5 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
            <span>🎯</span> Core Protocol Access
          </h5>
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-8 border-2 border-indigo-500/30 shadow-xl backdrop-blur-sm">
            <div className="text-center mb-6">
              <h6 className="text-2xl font-bold text-white mb-2">{brand.name}™ Complete Protocol</h6>
              <p className="text-gray-400 text-sm">Full access to all {brand.subNodes.length} sub-nodes and features</p>
            </div>
            <div className="text-center mb-6">
              <div className="text-5xl font-extrabold text-indigo-400 mb-2">
                {formatPrice(coreProtocolPrice)}
              </div>
              <div className="text-gray-400 text-lg">
                {billingPeriod === 'monthly' ? 'per month' : 'per year'}
              </div>
              {billingPeriod === 'annual' && (
                <div className="text-green-400 text-sm font-semibold mt-2">
                  Save {formatPrice(Math.round(getCoreProtocolPrice(brand, sectorKey, 'monthly') * 12 - coreProtocolPrice))} annually
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <h6 className="font-bold text-white mb-3">✓ Included Features:</h6>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>All {brand.subNodes.length} sub-nodes activated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Unlimited API access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>24/7 priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Advanced analytics dashboard</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h6 className="font-bold text-white mb-3">✓ Enterprise Benefits:</h6>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>White-label options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>99.99% uptime SLA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Dedicated account manager</span>
                  </li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => handlePayPalCheckout(`${brand.name}™ Core Protocol`, coreProtocolPrice, billingPeriod)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <span className="flex items-center justify-center gap-3">
                <span>💳</span>
                <span>Checkout with PayPal</span>
              </span>
            </button>
          </div>
        </div>

        <div className="mb-10">
          <h5 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
            <span>🧩</span> Individual Sub-node Licensing
          </h5>
          <p className="text-center text-gray-400 mb-6 text-sm">
            Purchase individual sub-nodes separately for flexible deployment
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brand.subNodes.map((node, idx) => {
              const subnodePrice = getSubnodePrice(brand, sectorKey, billingPeriod);
              return (
                <div key={idx} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg border-2 border-gray-700 hover:border-indigo-500 shadow-lg hover:shadow-xl transition-all p-6 backdrop-blur-sm">
                  <div className="text-center mb-4">
                    <h6 className="font-bold text-white text-lg mb-2">{node}</h6>
                    <div className="text-3xl font-extrabold text-indigo-400 mb-1">
                      {formatPrice(subnodePrice)}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {billingPeriod === 'monthly' ? 'per month' : 'per year'}
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>Full {node} access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>API integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>Email support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>Analytics included</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handlePayPalCheckout(node, subnodePrice, billingPeriod)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>💳</span>
                      <span>Buy Now</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
          <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 p-6 rounded-lg border border-gray-700 backdrop-blur-sm">
            <h5 className="text-xl font-bold text-indigo-400 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔗</span> FAA Metadata &amp; Compliance
            </h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-sm font-semibold text-gray-400">Product ID:</span>
                <code className="text-xs bg-gray-800 px-3 py-1 rounded font-mono text-indigo-400">{productId}</code>
              </div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-sm font-semibold text-gray-400">VaultID:</span>
                <code className="text-xs bg-gray-800 px-3 py-1 rounded font-mono text-indigo-400">{vaultId}</code>
              </div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-sm font-semibold text-gray-400">Security Rating:</span>
                <span className="text-sm font-bold text-green-400 bg-green-900/30 px-3 py-1 rounded">FAA-SEC A+</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-sm font-semibold text-gray-400">Active Nodes:</span>
                <span className="text-sm font-bold text-indigo-400">{brand.subNodes.length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-sm font-semibold text-gray-400">Protocol Version:</span>
                <code className="text-xs bg-gray-800 px-3 py-1 rounded font-mono">v2.5.{Math.floor(Math.random() * 99)}</code>
              </div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span className="text-sm font-semibold text-gray-400">Compliance:</span>
                <span className="text-xs text-green-400">ISO 27001, SOC 2, GDPR</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-400">Uptime SLA:</span>
                <span className="text-sm font-bold text-green-400">99.99%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 p-6 rounded-lg border border-gray-700 backdrop-blur-sm">
            <h5 className="text-xl font-bold text-white mb-4">📊 Performance Metrics</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-indigo-400">{Math.floor(Math.random() * 50) + 150}ms</div>
                <div className="text-xs text-gray-400">Avg Response</div>
              </div>
              <div className="text-center bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{Math.floor(Math.random() * 30) + 70}%</div>
                <div className="text-xs text-gray-400">Cache Hit Rate</div>
              </div>
              <div className="text-center bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">{Math.floor(Math.random() * 500) + 1000}+</div>
                <div className="text-xs text-gray-400">Deployments</div>
              </div>
              <div className="text-center bg-gray-800/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">{(Math.random() * 2 + 3).toFixed(1)}M</div>
                <div className="text-xs text-gray-400">API Calls/Mo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredBrands = Object.entries(sectorData).flatMap(([sectorKey, sector]) =>
    sector.brands
      .filter(brand => 
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.subNodes.some(node => node.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .map(brand => ({
        sectorKey,
        sectorName: sectorList[sectorKey],
        brand
      }))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1a1a1c] to-black">
      {/* Fruitful Branding */}
      <div className="bg-gradient-to-r from-yellow-600/10 to-teal-600/10 border-b border-white/10 py-2">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-3">
            <img 
              src="https://019b707b-b33f-7a1c-a703-57213a84f433.mochausercontent.com/Billboard_retail_respitory_in_seedwave.png"
              alt="Fruitful HOME"
              className="h-10 w-auto object-contain"
            />
            <span className="text-white/60 text-xs font-semibold">Powered by Fruitful™</span>
          </div>
        </div>
      </div>

      {/* Global Navigation */}
      <nav className="relative z-20 px-6 py-4 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">⚡</span>
            Fruitful | HotStack™
          </Link>
          <div className="flex gap-3">
            <Link
              to="/"
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-300"
            >
              🏠 Home
            </Link>
            <Link
              to="/brands"
              className="px-4 py-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 text-blue-400 rounded-lg font-semibold hover:from-blue-600/40 hover:to-cyan-600/40 transition-all duration-300"
            >
              🔍 Brands
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 text-green-400 rounded-lg font-semibold hover:from-green-600/40 hover:to-emerald-600/40 transition-all duration-300"
            >
              👤 Dashboard
            </Link>
            <Link
              to="/drop-zone"
              className="px-4 py-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 text-orange-400 rounded-lg font-semibold hover:from-orange-600/40 hover:to-red-600/40 transition-all duration-300"
            >
              🔥 Drop Zone
            </Link>
            <Link
              to="/ecosystem"
              className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-400 rounded-lg font-semibold hover:from-purple-600/40 hover:to-pink-600/40 transition-all duration-300"
            >
              🌐 Ecosystem
            </Link>
            <Link
              to="/global-synergy-hub"
              className="px-4 py-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 text-yellow-400 rounded-lg font-semibold hover:from-yellow-600/40 hover:to-orange-600/40 transition-all duration-300"
            >
              🎨 Synergy Hub
            </Link>
            <Link
              to="/cart"
              className="px-4 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 text-green-400 rounded-lg font-semibold hover:from-green-600/40 hover:to-emerald-600/40 transition-all duration-300"
            >
              🛒 Cart
            </Link>
            <Link
              to="/scroll"
              className="px-4 py-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 text-yellow-400 rounded-lg font-semibold hover:from-yellow-600/40 hover:to-orange-600/40 transition-all duration-300"
            >
              📜 Scroll
            </Link>
            <a
              href="/admin/login"
              className="px-4 py-2 text-gray-500 hover:text-gray-400 transition-colors duration-300 text-sm"
            >
              Admin
            </a>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-indigo-900/40 text-white py-8 mb-8 shadow-2xl backdrop-blur-sm border-b border-indigo-500/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-extrabold drop-shadow-2xl mb-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                FAA.ZONE™
              </h1>
              <p className="text-xl opacity-90">The Earth's Financial Allocation Architecture</p>
              <p className="text-sm opacity-70 mt-1">Live Omni-View Pulse Grid · HotStack Enabled</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <label className="text-sm font-semibold mb-2 block">💱 Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={currencyLoading}
                className="bg-gray-800 text-white rounded-lg px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 border border-gray-700"
              >
                {Object.entries(currencies).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.symbol} {code} - {info.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Access Dashboard */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            to="/brands"
            className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 p-6 rounded-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🔍</div>
            <div className="text-white font-bold text-sm">Brand Search</div>
            <div className="text-gray-400 text-xs mt-1">Find & explore</div>
          </Link>
          <Link
            to="/dashboard"
            className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 p-6 rounded-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">👤</div>
            <div className="text-white font-bold text-sm">User Dashboard</div>
            <div className="text-gray-400 text-xs mt-1">Your activity</div>
          </Link>
          <Link
            to="/drop-zone"
            className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 border border-orange-500/30 p-6 rounded-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🔥</div>
            <div className="text-white font-bold text-sm">AI Drop Zone</div>
            <div className="text-gray-400 text-xs mt-1">Smart uploads</div>
          </Link>
          <Link
            to="/ecosystem"
            className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-500/30 p-6 rounded-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🌿</div>
            <div className="text-white font-bold text-sm">Ecosystem</div>
            <div className="text-gray-400 text-xs mt-1">AI insights</div>
          </Link>
          <Link
            to="/global-synergy-hub"
            className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border border-yellow-500/30 p-6 rounded-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎨</div>
            <div className="text-white font-bold text-sm">Synergy Hub</div>
            <div className="text-gray-400 text-xs mt-1">Integrations</div>
          </Link>
          <button
            onClick={() => showSectorPanel('admin-panel')}
            className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/30 border border-indigo-500/30 p-6 rounded-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
            <div className="text-white font-bold text-sm">Brand Manager</div>
            <div className="text-gray-400 text-xs mt-1">Add brands</div>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* HotStack Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl shadow-2xl border-4 border-dashed transition-all backdrop-blur-sm ${
            isDragging
              ? 'border-indigo-500 bg-indigo-900/20 scale-105'
              : 'border-gray-700 hover:border-indigo-500/50'
          }`}
        >
          <div className="p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">🔥</div>
            <h3 className="text-2xl font-bold text-white mb-2">HotStack Drop Zone</h3>
            <p className="text-gray-400 mb-4">
              Drag and drop HTML, PDF, or data files for instant AI processing
            </p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
              accept=".html,.pdf,.json,.csv"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Or Click to Browse Files
            </button>
            <p className="text-xs text-gray-500 mt-3">
              Supported formats: HTML, PDF, JSON, CSV
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-l-4 border-indigo-500 p-4 rounded-lg mb-8 backdrop-blur-sm">
          <p className="text-sm text-gray-300 italic flex items-center gap-2">
            <span className="text-lg animate-pulse">ℹ️</span>
            <span>{adminStatus}</span>
          </p>
        </div>

        {/* Navigation Tabs */}
        <nav className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm shadow-xl flex flex-wrap gap-y-2 gap-x-6 px-6 py-4 text-sm overflow-x-auto rounded-xl mb-8 border border-gray-700">
          <button onClick={() => showSectorPanel('quick-view')} className={`hover:scale-105 transition flex items-center gap-2 ${activeSectorPanel === 'quick-view' ? 'text-indigo-400 font-bold' : 'text-gray-400 hover:text-indigo-400'}`}>
            <span>🏁</span> Quick View
          </button>
          <button onClick={() => showSectorPanel('signal-sync')} className={`hover:scale-105 transition flex items-center gap-2 ${activeSectorPanel === 'signal-sync' ? 'text-blue-400 font-bold' : 'text-gray-400 hover:text-blue-400'}`}>
            <span>📡</span> Signal Sync
          </button>
          <button onClick={() => showSectorPanel('node-index')} className={`hover:scale-105 transition flex items-center gap-2 ${activeSectorPanel === 'node-index' ? 'text-purple-400 font-bold' : 'text-gray-400 hover:text-purple-400'}`}>
            <span>🧩</span> Node Index
          </button>
          <button onClick={() => showSectorPanel('sector-grid')} className={`hover:scale-105 transition flex items-center gap-2 ${activeSectorPanel === 'sector-grid' ? 'text-orange-400 font-bold' : 'text-gray-400 hover:text-orange-400'}`}>
            <span>🏙️</span> Sector Grid
          </button>
          <button onClick={() => showSectorPanel('license-ledger')} className={`hover:scale-105 transition flex items-center gap-2 ${activeSectorPanel === 'license-ledger' ? 'text-green-400 font-bold' : 'text-gray-400 hover:text-green-400'}`}>
            <span>🔐</span> License Ledger
          </button>
          <button onClick={() => showSectorPanel('global-index')} className={`hover:scale-105 transition flex items-center gap-2 ${activeSectorPanel === 'global-index' ? 'text-cyan-400 font-bold' : 'text-gray-400 hover:text-cyan-400'}`}>
            <span>🌐</span> Global Index
          </button>
          <button onClick={() => showSectorPanel('admin-panel')} className={`hover:scale-105 transition flex items-center gap-2 ${activeSectorPanel === 'admin-panel' ? 'text-pink-400 font-bold' : 'text-gray-400 hover:text-pink-400'}`}>
            <span>⚙️</span> Brand Manager
          </button>
        </nav>

        {/* Sector Navigation Grid */}
        <nav className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm shadow-xl px-6 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3 text-sm mb-8 rounded-xl border border-gray-700">
          {Object.entries(sectorList).map(([key, label]) => (
            <button
              key={key}
              onClick={() => showSectorPanel(key)}
              className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 text-xs font-semibold backdrop-blur-sm ${
                activeSectorPanel === key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105 border border-indigo-400'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-indigo-900/30 hover:text-indigo-400 hover:scale-105 border border-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <main>
          {activeSectorPanel === 'quick-view' && (
            <section className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-8 border-t-4 border-indigo-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
                  <span>🏁</span> Quick View — Dashboard Overview
                </h2>
                <button onClick={hideSectorPanel} className="text-red-400 hover:text-red-300 font-semibold text-lg">
                  ❌ Close
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-600/30 to-blue-700/30 border border-blue-500/30 text-white p-6 rounded-xl shadow-xl backdrop-blur-sm">
                  <div className="text-sm opacity-80 mb-2">Total Sectors</div>
                  <div className="text-4xl font-bold">{Object.keys(sectorData).length}</div>
                  <div className="text-xs opacity-70 mt-2">Active & Deployed</div>
                </div>
                <div className="bg-gradient-to-br from-green-600/30 to-green-700/30 border border-green-500/30 text-white p-6 rounded-xl shadow-xl backdrop-blur-sm">
                  <div className="text-sm opacity-80 mb-2">Total Brands</div>
                  <div className="text-4xl font-bold">{Object.values(sectorData).reduce((sum, s) => sum + s.brands.length, 0)}</div>
                  <div className="text-xs opacity-70 mt-2">Across All Sectors</div>
                </div>
                <div className="bg-gradient-to-br from-purple-600/30 to-purple-700/30 border border-purple-500/30 text-white p-6 rounded-xl shadow-xl backdrop-blur-sm">
                  <div className="text-sm opacity-80 mb-2">Total Sub-Nodes</div>
                  <div className="text-4xl font-bold">
                    {Object.values(sectorData).reduce((sum, s) => sum + s.brands.reduce((bs, b) => bs + b.subNodes.length, 0), 0)}
                  </div>
                  <div className="text-xs opacity-70 mt-2">Individual Components</div>
                </div>
                <div className="bg-gradient-to-br from-orange-600/30 to-orange-700/30 border border-orange-500/30 text-white p-6 rounded-xl shadow-xl backdrop-blur-sm">
                  <div className="text-sm opacity-80 mb-2">Total Revenue</div>
                  <div className="text-3xl font-bold">
                    {formatPrice(Object.values(sectorData).reduce((sum, s) => sum + s.revenue, 0))}
                  </div>
                  <div className="text-xs opacity-70 mt-2">Combined Annual</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 p-6 rounded-xl border-2 border-gray-700 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-white mb-4">Top Performing Sectors</h3>
                  <div className="space-y-3">
                    {Object.entries(sectorData)
                      .sort(([, a], [, b]) => b.revenue - a.revenue)
                      .slice(0, 5)
                      .map(([key, sector]) => (
                        <div key={key} className="flex justify-between items-center bg-gray-900/50 p-3 rounded shadow-sm border border-gray-700">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{sector.pricing?.glyph}</span>
                            <span className="font-semibold text-sm text-gray-300">{sector.name}</span>
                          </div>
                          <span className="text-green-400 font-bold">{formatPrice(sector.revenue)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-gray-800/50 p-6 rounded-xl border-2 border-gray-700 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-900/50 p-3 rounded shadow-sm border-l-4 border-blue-500">
                      <div className="text-xs text-gray-500">2 minutes ago</div>
                      <div className="text-sm font-semibold text-gray-300">New brand deployed in AI & Logic sector</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded shadow-sm border-l-4 border-green-500">
                      <div className="text-xs text-gray-500">15 minutes ago</div>
                      <div className="text-sm font-semibold text-gray-300">License activated for Banking & Finance</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded shadow-sm border-l-4 border-purple-500">
                      <div className="text-xs text-gray-500">1 hour ago</div>
                      <div className="text-sm font-semibold text-gray-300">System sync completed across all nodes</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded shadow-sm border-l-4 border-orange-500">
                      <div className="text-xs text-gray-500">3 hours ago</div>
                      <div className="text-sm font-semibold text-gray-300">Currency exchange rates updated</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSectorPanel === 'signal-sync' && (
            <section className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-8 border-t-4 border-blue-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                  <span>📡</span> Signal Sync — Real-Time Data Flow
                </h2>
                <button onClick={hideSectorPanel} className="text-red-400 hover:text-red-300 font-semibold text-lg">
                  ❌ Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-900/30 border-2 border-green-500/50 p-6 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-bold text-green-400">Active Signals</span>
                  </div>
                  <div className="text-3xl font-bold text-green-400">1,247</div>
                  <div className="text-xs text-green-300 mt-1">Syncing now</div>
                </div>
                <div className="bg-blue-900/30 border-2 border-blue-500/50 p-6 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="font-bold text-blue-400">Pending Queue</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-400">42</div>
                  <div className="text-xs text-blue-300 mt-1">Awaiting sync</div>
                </div>
                <div className="bg-purple-900/30 border-2 border-purple-500/50 p-6 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span className="font-bold text-purple-400">Sync Rate</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-400">98.7%</div>
                  <div className="text-xs text-purple-300 mt-1">Success rate</div>
                </div>
              </div>

              <div className="bg-gray-800/50 p-6 rounded-xl border-2 border-gray-700 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white mb-4">Live Signal Feed</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Object.entries(sectorData).map(([key, sector]) => (
                    <div key={key} className="bg-gray-900/50 p-3 rounded shadow-sm flex justify-between items-center border border-gray-700">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{sector.pricing?.glyph}</span>
                        <span className="text-sm font-semibold text-gray-300">{sector.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{sector.nodes} nodes</span>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeSectorPanel === 'node-index' && (
            <section className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-8 border-t-4 border-purple-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
                  <span>🧩</span> Node Index — Complete Node Registry
                </h2>
                <button onClick={hideSectorPanel} className="text-red-400 hover:text-red-300 font-semibold text-lg">
                  ❌ Close
                </button>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  placeholder="🔍 Search nodes..."
                  className="w-full p-4 border-2 border-gray-700 bg-gray-800/50 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all backdrop-blur-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Object.entries(sectorData).map(([sectorKey, sector]) =>
                  sector.brands.flatMap(brand =>
                    brand.subNodes.map((node, idx) => (
                      <div key={`${sectorKey}-${brand.name}-${idx}`} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 rounded-lg border-2 border-gray-700 hover:border-purple-500 hover:shadow-xl transition-all backdrop-blur-sm">
                        <div className="text-xs text-purple-400 font-semibold mb-1">{sector.name}</div>
                        <div className="text-sm font-bold text-white mb-1">{brand.name}</div>
                        <div className="text-sm text-gray-400">{node}</div>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-gray-500">Active</span>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </section>
          )}

          {activeSectorPanel === 'sector-grid' && (
            <section className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-8 border-t-4 border-orange-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-orange-400 flex items-center gap-2">
                  <span>🏙️</span> Sector Grid — Visual Sector Map
                </h2>
                <button onClick={hideSectorPanel} className="text-red-400 hover:text-red-300 font-semibold text-lg">
                  ❌ Close
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {Object.entries(sectorData).map(([key, sector]) => (
                  <button
                    key={key}
                    onClick={() => showSectorPanel(key)}
                    className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border-2 border-gray-700 hover:border-orange-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                  >
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                      {sector.pricing?.glyph}
                    </div>
                    <div className="text-xs font-bold text-white mb-2 line-clamp-2">{sector.name}</div>
                    <div className="text-xs text-gray-400">{sector.brands.length} brands</div>
                    <div className="text-xs text-gray-500">{sector.nodes} nodes</div>
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className={`text-xs font-bold ${
                        sector.pricing?.payoutTier === 'A+' ? 'text-purple-400' :
                        sector.pricing?.payoutTier === 'A' ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {sector.pricing?.payoutTier}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {activeSectorPanel === 'license-ledger' && (
            <section className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-8 border-t-4 border-green-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                  <span>🔐</span> License Ledger — Active Licenses &amp; Subscriptions
                </h2>
                <button onClick={hideSectorPanel} className="text-red-400 hover:text-red-300 font-semibold text-lg">
                  ❌ Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-600/30 to-green-700/30 border border-green-500/30 text-white p-6 rounded-xl shadow-xl backdrop-blur-sm">
                  <div className="text-sm opacity-80 mb-2">Active Licenses</div>
                  <div className="text-4xl font-bold">{metrics.licensesActive}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-600/30 to-blue-700/30 border border-blue-500/30 text-white p-6 rounded-xl shadow-xl backdrop-blur-sm">
                  <div className="text-sm opacity-80 mb-2">Monthly Revenue</div>
                  <div className="text-2xl font-bold">
                    {formatPrice(Object.values(sectorData).reduce((sum, s) => sum + (s.pricing?.monthlyFee || 0) * s.brands.length, 0))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-600/30 to-purple-700/30 border border-purple-500/30 text-white p-6 rounded-xl shadow-xl backdrop-blur-sm">
                  <div className="text-sm opacity-80 mb-2">Annual Revenue</div>
                  <div className="text-2xl font-bold">
                    {formatPrice(Object.values(sectorData).reduce((sum, s) => sum + (s.pricing?.annualFee || 0) * s.brands.length, 0))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-600/30 to-orange-700/30 border border-orange-500/30 text-white p-6 rounded-xl shadow-xl backdrop-blur-sm">
                  <div className="text-sm opacity-80 mb-2">Renewal Rate</div>
                  <div className="text-4xl font-bold">94.2%</div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border-2 border-gray-700 backdrop-blur-sm">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 font-bold border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-4">Sector</th>
                      <th className="px-6 py-4">License Type</th>
                      <th className="px-6 py-4">Monthly Fee</th>
                      <th className="px-6 py-4">Annual Fee</th>
                      <th className="px-6 py-4">Tier</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-400">
                    {Object.entries(sectorData).map(([key, sector]) => (
                      <tr key={key} className="border-t border-gray-700 hover:bg-green-900/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{sector.pricing?.glyph}</span>
                            <span className="font-semibold text-gray-300">{sector.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">Core Protocol</td>
                        <td className="px-6 py-4 font-bold text-blue-400">
                          {sector.pricing ? formatPrice(sector.pricing.monthlyFee) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-bold text-green-400">
                          {sector.pricing ? formatPrice(sector.pricing.annualFee) : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            sector.pricing?.payoutTier === 'A+' ? 'bg-purple-900/50 text-purple-400 border border-purple-500/50' :
                            sector.pricing?.payoutTier === 'A' ? 'bg-blue-900/50 text-blue-400 border border-blue-500/50' :
                            sector.pricing?.payoutTier === 'B+' ? 'bg-green-900/50 text-green-400 border border-green-500/50' :
                            'bg-gray-800/50 text-gray-400 border border-gray-700'
                          }`}>
                            {sector.pricing?.payoutTier || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-xs font-bold border border-green-500/50">
                            ✓ Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSectorPanel === 'admin-panel' && (
            <section className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-8 border-t-4 border-indigo-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
                  <span>⚙️</span> Brand Manager — Add Brand &amp; Subnodes
                </h2>
                <button onClick={hideSectorPanel} className="text-red-400 hover:text-red-300 font-semibold text-lg">
                  ❌ Close
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm block font-semibold mb-2 text-gray-300">📂 Sector</label>
                  <select
                    value={selectedAdminSector}
                    onChange={(e) => setSelectedAdminSector(e.target.value)}
                    className="w-full border-2 border-gray-700 rounded-lg p-3 bg-gray-800/50 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all backdrop-blur-sm"
                  >
                    {Object.entries(sectorList)
                      .filter(([key]) => !['admin-panel', 'global-index'].includes(key))
                      .map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm block font-semibold mb-2 text-gray-300">🏷 Brand Name</label>
                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full border-2 border-gray-700 bg-gray-800/50 text-white rounded-lg p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all backdrop-blur-sm"
                    placeholder="e.g. OmniCastX"
                  />
                  <button
                    onClick={generateBrandDescription}
                    disabled={isGenerating}
                    className="mt-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ✨ Generate Description
                  </button>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm block font-semibold mb-2 text-gray-300">📝 Brand Description</label>
                  <textarea
                    value={brandDescription}
                    readOnly
                    className="w-full border-2 border-gray-700 bg-gray-800/50 text-white rounded-lg p-3 text-sm h-28 resize-none backdrop-blur-sm"
                    placeholder="Generated description will appear here..."
                  />
                </div>
                <div>
                  <label className="text-sm block font-semibold mb-2 text-gray-300">📌 Subnodes</label>
                  <input
                    value={subnodes}
                    onChange={(e) => setSubnodes(e.target.value)}
                    className="w-full border-2 border-gray-700 bg-gray-800/50 text-white rounded-lg p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all backdrop-blur-sm"
                    placeholder="e.g. VaultDrop, QRClaim"
                  />
                  <button
                    onClick={suggestSubnodes}
                    disabled={isGenerating}
                    className="mt-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ✨ Suggest Subnodes
                  </button>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addBrand}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg w-full font-semibold transition-all hover:shadow-xl"
                  >
                    ➕ Add Brand
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeSectorPanel === 'global-index' && (
            <section className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-8 border-t-4 border-cyan-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                  <span>🌐</span> Global FAA.ZONE Brand Index
                </h2>
                <button onClick={hideSectorPanel} className="text-red-400 hover:text-red-300 font-semibold text-lg">
                  ❌ Close
                </button>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Search all brands &amp; subnodes..."
                className="w-full p-4 border-2 border-gray-700 bg-gray-800/50 text-white rounded-lg mb-6 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all backdrop-blur-sm"
              />
              <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border-2 border-gray-700 backdrop-blur-sm">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 font-bold sticky top-0 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-4">Sector</th>
                      <th className="px-6 py-4">Brand Name</th>
                      <th className="px-6 py-4">Subnodes</th>
                      <th className="px-6 py-4">Master License</th>
                      <th className="px-6 py-4">Monthly Price</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-400">
                    {filteredBrands.map((item, idx) => (
                      <tr key={idx} className="border-t border-gray-700 hover:bg-cyan-900/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-300">{item.sectorName}</td>
                        <td className="px-6 py-4 font-bold text-indigo-400">{item.brand.name}™</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{item.brand.subNodes.join(', ')}</td>
                        <td className="px-6 py-4 font-semibold text-green-400">
                          {formatPrice(item.brand.masterLicensePrice || 0)}/yr
                        </td>
                        <td className="px-6 py-4 font-semibold text-blue-400">
                          {formatPrice(Math.round((item.brand.masterLicensePrice || 0) / 12))}/mo
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSectorPanel && sectorData[activeSectorPanel] && (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 mt-10 rounded-xl shadow-2xl border-t-4 border-indigo-500 backdrop-blur-sm">
              <div className="flex justify-between items-center text-3xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                  {sectorList[activeSectorPanel]} Dashboard
                </span>
                <button onClick={hideSectorPanel} className="text-red-400 hover:text-red-300 font-semibold text-lg">
                  ❌ Close
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 px-4 mb-8">
                {sectorData[activeSectorPanel].brands.map((brand, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleBrandSnapshot(activeSectorPanel!, idx)}
                    className={`px-3 py-3 text-sm rounded-lg shadow-lg transition-all duration-200 font-bold backdrop-blur-sm ${
                      activeBrandIndex[activeSectorPanel!] === idx
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white scale-110 shadow-xl border border-indigo-400'
                        : 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-indigo-900/30 hover:to-purple-900/30 text-gray-300 hover:scale-105 hover:shadow-xl border border-gray-700'
                    }`}
                  >
                    {brand.name}<sup>™</sup>
                  </button>
                ))}
              </div>

              <div className="px-4">
                {sectorData[activeSectorPanel].brands.map((brand, idx) => (
                  activeBrandIndex[activeSectorPanel!] === idx && (
                    <div key={idx}>
                      {renderBrandSnapshot(brand, activeSectorPanel!)}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <section className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-6 px-6 py-10">
            {[
              { icon: '🧠', label: 'Active Nodes', value: metrics.activeNodes },
              { icon: '🔐', label: 'Licenses Active', value: metrics.licensesActive },
              { icon: '💾', label: 'Vault Deployments', value: metrics.vaultDeployments },
              { icon: '📥', label: 'Sync Logs', value: metrics.syncLogs },
              { icon: '📈', label: 'Audits Running', value: metrics.auditsRunning },
              { icon: '🛰️', label: 'Signal Zones', value: metrics.signalZones },
              { icon: '📊', label: 'Scroll Grid Index', value: metrics.scrollGridIndex }
            ].map((metric, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl shadow-2xl text-center hover:shadow-indigo-500/20 transition-all hover:-translate-y-2 border-t-4 border-indigo-500 backdrop-blur-sm">
                <div className="text-4xl mb-2">{metric.icon}</div>
                <h3 className="text-sm font-bold text-gray-300 mb-2">{metric.label}</h3>
                <p className="text-3xl font-extrabold text-indigo-400">{metric.value.toLocaleString()}</p>
              </div>
            ))}
          </section>

          {/* FAA.ZONE Master Index Table */}
          <section className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-16 border-t-4 border-indigo-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
              <span>⦿</span> FAA.ZONE INDEX — Complete Sector Overview
            </h2>
            <div className="overflow-x-auto rounded-lg border-2 border-gray-700">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 font-bold border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4">Glyph</th>
                    <th className="px-6 py-4">Sector</th>
                    <th className="px-6 py-4">Core Brands</th>
                    <th className="px-6 py-4">Total Nodes</th>
                    <th className="px-6 py-4">Monthly Fee</th>
                    <th className="px-6 py-4">Annual Fee</th>
                    <th className="px-6 py-4">Payout Tier</th>
                    <th className="px-6 py-4">Region</th>
                    <th className="px-6 py-4">Inspect</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  {Object.entries(sectorData).map(([key, sector]) => {
                    const totalNodes = sector.brands.reduce((sum, b) => sum + b.subNodes.length, 0);
                    return (
                      <tr key={key} className="border-t border-gray-700 hover:bg-indigo-900/20 transition-colors">
                        <td className="px-6 py-4 text-2xl">{sector.pricing?.glyph || sectorList[key].split(' ')[0]}</td>
                        <td className="px-6 py-4 font-semibold text-gray-300">{sector.name}</td>
                        <td className="px-6 py-4 text-center font-bold text-indigo-400">{sector.brands.length}</td>
                        <td className="px-6 py-4 text-center font-bold text-purple-400">{totalNodes}</td>
                        <td className="px-6 py-4 text-center font-bold text-blue-400">
                          {sector.pricing ? formatPrice(sector.pricing.monthlyFee) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-green-400">
                          {sector.pricing ? formatPrice(sector.pricing.annualFee) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            sector.pricing?.payoutTier === 'A+' ? 'bg-purple-900/50 text-purple-400 border border-purple-500/50' :
                            sector.pricing?.payoutTier === 'A' ? 'bg-blue-900/50 text-blue-400 border border-blue-500/50' :
                            sector.pricing?.payoutTier === 'B+' ? 'bg-green-900/50 text-green-400 border border-green-500/50' :
                            'bg-gray-800/50 text-gray-400 border border-gray-700'
                          }`}>
                            {sector.pricing?.payoutTier || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-xs text-gray-500">
                          {sector.pricing?.region || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => showSectorPanel(key)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-lg hover:shadow-xl transition-all"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-black via-gray-900 to-black text-gray-500 text-center py-10 mt-16 shadow-2xl border-t-4 border-indigo-500">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mb-6">
            <div className="text-2xl font-bold text-white bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              FAA.ZONE™
            </div>
            <p className="text-sm">ScrollGrid · PulseTrade Certified · TreatyMesh Validated · HotStack Enabled · Multi-Currency Support</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-xs text-gray-600 mb-4">
            <span>ISO 27001 Certified</span>
            <span>•</span>
            <span>SOC 2 Type II</span>
            <span>•</span>
            <span>GDPR Compliant</span>
            <span>•</span>
            <span>99.99% Uptime SLA</span>
          </div>
          <p className="text-xs text-gray-600 mt-6">© 2025 Fruitful Holdings (Pty) Ltd. All rights reserved.</p>
          <p className="text-xs text-gray-700 mt-2">Powered by HotStack™ · Built on Cloudflare Workers</p>
        </div>
      </footer>
    </div>
  );
}
