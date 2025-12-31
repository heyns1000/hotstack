import { useState } from 'react';
import { Link } from 'react-router';
import { sectorData, sectorList } from '@/worker/data/sectors';

interface NewBrand {
  sectorKey: string;
  name: string;
  subnodes: string[];
  masterLicensePrice: number;
}

export default function BrandManagement() {
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newBrand, setNewBrand] = useState<NewBrand>({
    sectorKey: '',
    name: '',
    subnodes: [],
    masterLicensePrice: 10000
  });
  
  const [subnodeInput, setSubnodeInput] = useState('');

  const handleAddSubnode = () => {
    if (subnodeInput.trim()) {
      setNewBrand({
        ...newBrand,
        subnodes: [...newBrand.subnodes, subnodeInput.trim()]
      });
      setSubnodeInput('');
    }
  };

  const handleRemoveSubnode = (index: number) => {
    setNewBrand({
      ...newBrand,
      subnodes: newBrand.subnodes.filter((_, i) => i !== index)
    });
  };

  const handleSubmitNewBrand = () => {
    if (!newBrand.sectorKey || !newBrand.name || newBrand.subnodes.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    // In production, this would make an API call to save the brand
    console.log('Submitting new brand:', newBrand);
    alert('Brand created successfully! (Demo mode - not actually saved)');
    
    // Reset form
    setNewBrand({
      sectorKey: '',
      name: '',
      subnodes: [],
      masterLicensePrice: 10000
    });
    setShowAddForm(false);
  };

  const handleDeleteBrand = (sectorKey: string, brandName: string) => {
    if (confirm(`Are you sure you want to delete ${brandName}?`)) {
      console.log('Deleting brand:', { sectorKey, brandName });
      alert('Brand deleted! (Demo mode - not actually deleted)');
    }
  };

  const filteredSectors = selectedSector 
    ? { [selectedSector]: sectorData[selectedSector] }
    : sectorData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <span className="text-4xl">🏭</span>
              <div>
                <h1 className="text-2xl font-black text-white">Brand Management</h1>
                <p className="text-xs text-gray-400">Add, edit, and manage ecosystem brands</p>
              </div>
            </Link>
            <div className="flex gap-4">
              <Link to="/hotstack" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all">
                HotStack
              </Link>
              <Link to="/brands" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all">
                Brand Search
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-3xl font-black text-blue-400">
              {Object.values(sectorData).reduce((sum, s) => sum + s.brands.length, 0)}
            </div>
            <div className="text-white font-semibold">Total Brands</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-2">🌐</div>
            <div className="text-3xl font-black text-green-400">{Object.keys(sectorData).length}</div>
            <div className="text-white font-semibold">Active Sectors</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-2">🧩</div>
            <div className="text-3xl font-black text-purple-400">
              {Object.values(sectorData).reduce((sum, s) => sum + s.brands.reduce((bs, b) => bs + b.subNodes.length, 0), 0)}
            </div>
            <div className="text-white font-semibold">Total Sub-Nodes</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-3xl font-black text-orange-400">
              {(Object.values(sectorData).reduce((sum, s) => sum + s.brands.reduce((bs, b) => bs + b.subNodes.length, 0), 0) / 
                Object.values(sectorData).reduce((sum, s) => sum + s.brands.length, 0)).toFixed(1)}
            </div>
            <div className="text-white font-semibold">Avg Nodes/Brand</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-white font-semibold mb-2">Filter by Sector</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg text-white focus:border-blue-500 transition-all"
              >
                <option value="">All Sectors</option>
                {Object.entries(sectorList).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              {showAddForm ? '❌ Cancel' : '➕ Add New Brand'}
            </button>
          </div>
        </div>

        {/* Add Brand Form */}
        {showAddForm && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <span>➕</span> Create New Brand
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Sector *</label>
                  <select
                    value={newBrand.sectorKey}
                    onChange={(e) => setNewBrand({ ...newBrand, sectorKey: e.target.value })}
                    className="w-full px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg text-white focus:border-blue-500 transition-all"
                  >
                    <option value="">Select Sector</option>
                    {Object.entries(sectorList).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Brand Name *</label>
                  <input
                    type="text"
                    value={newBrand.name}
                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                    placeholder="e.g., TechVault™"
                    className="w-full px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Master License Price ($)</label>
                <input
                  type="number"
                  value={newBrand.masterLicensePrice}
                  onChange={(e) => setNewBrand({ ...newBrand, masterLicensePrice: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg text-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Sub-Nodes *</label>
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={subnodeInput}
                    onChange={(e) => setSubnodeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubnode()}
                    placeholder="Enter sub-node name (e.g., CoreSync™)"
                    className="flex-1 px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 transition-all"
                  />
                  <button
                    onClick={handleAddSubnode}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
                  >
                    Add
                  </button>
                </div>
                
                {newBrand.subnodes.length > 0 && (
                  <div className="space-y-2">
                    {newBrand.subnodes.map((node, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-black/30 px-4 py-2 rounded-lg border border-white/10">
                        <span className="text-white">{node}</span>
                        <button
                          onClick={() => handleRemoveSubnode(idx)}
                          className="text-red-400 hover:text-red-300 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitNewBrand}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all"
                >
                  Create Brand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Brands List */}
        <div className="space-y-6">
          {Object.entries(filteredSectors).map(([sectorKey, sector]) => (
            <div key={sectorKey} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{sector.pricing?.glyph}</span>
                  <div>
                    <h2 className="text-2xl font-black text-white">{sector.name}</h2>
                    <p className="text-sm text-gray-400">{sector.brands.length} brands</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sector.brands.map((brand, idx) => (
                  <div key={idx} className="bg-black/30 rounded-lg p-4 border border-white/10 hover:border-blue-500/50 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        {brand.name}
                      </h3>
                      <div className="flex gap-2">
                        <button className="text-blue-400 hover:text-blue-300 text-sm">✏️</button>
                        <button 
                          onClick={() => handleDeleteBrand(sectorKey, brand.name)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {brand.masterLicensePrice && (
                      <div className="mb-3 pb-3 border-b border-white/10">
                        <div className="text-xl font-black text-green-400">
                          ${brand.masterLicensePrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">Master License</div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="text-xs text-gray-400 font-semibold mb-2">
                        {brand.subNodes.length} Sub-Nodes
                      </div>
                      {brand.subNodes.slice(0, 3).map((node, sidx) => (
                        <div key={sidx} className="text-sm text-gray-300 flex items-center gap-2">
                          <span>•</span>
                          <span>{node}</span>
                        </div>
                      ))}
                      {brand.subNodes.length > 3 && (
                        <div className="text-xs text-gray-500 italic">
                          +{brand.subNodes.length - 3} more...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
