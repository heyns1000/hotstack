import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { sectorData, sectorList } from '@/worker/data/sectors';
import type { Brand } from '@/worker/data/sectors';
import { useCurrency } from '@/react-app/hooks/useCurrency';

interface SearchResult {
  sectorKey: string;
  sectorName: string;
  brand: Brand;
  matchedSubnodes: string[];
  matchType: 'brand' | 'subnode' | 'both';
}

export default function GlobalBrandSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const { formatPrice } = useCurrency();

  const allResults = useMemo(() => {
    const results: SearchResult[] = [];
    
    Object.entries(sectorData).forEach(([sectorKey, sector]) => {
      sector.brands.forEach(brand => {
        const matchedSubnodes = brand.subNodes.filter(subnode =>
          subnode.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        const brandMatches = brand.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (searchQuery === '' || brandMatches || matchedSubnodes.length > 0) {
          results.push({
            sectorKey,
            sectorName: sector.name,
            brand,
            matchedSubnodes,
            matchType: brandMatches && matchedSubnodes.length > 0 ? 'both' : 
                      brandMatches ? 'brand' : 'subnode'
          });
        }
      });
    });
    
    return results;
  }, [searchQuery]);

  const filteredResults = useMemo(() => {
    return allResults.filter(result => {
      const sectorMatch = selectedSector === 'all' || result.sectorKey === selectedSector;
      const sector = sectorData[result.sectorKey];
      const tierMatch = selectedTier === 'all' || sector.pricing?.payoutTier === selectedTier;
      return sectorMatch && tierMatch;
    });
  }, [allResults, selectedSector, selectedTier]);

  const stats = useMemo(() => {
    const totalBrands = Object.values(sectorData).reduce((sum, s) => sum + s.brands.length, 0);
    const totalSubnodes = Object.values(sectorData).reduce(
      (sum, s) => sum + s.brands.reduce((bs, b) => bs + b.subNodes.length, 0), 0
    );
    const totalSectors = Object.keys(sectorData).length;
    
    return { totalBrands, totalSubnodes, totalSectors };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="text-4xl">🌐</span>
              <div>
                <h1 className="text-2xl font-black text-white">Global Brand Index</h1>
                <p className="text-xs text-gray-400">Search across all sectors</p>
              </div>
            </Link>
            <div className="flex gap-4">
              <Link to="/hotstack" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all">
                HotStack Admin
              </Link>
              <Link to="/ecosystem" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all">
                Ecosystem
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-5xl font-black text-blue-400 mb-2">{stats.totalSectors}</div>
            <div className="text-white text-lg font-semibold">Active Sectors</div>
            <div className="text-gray-400 text-sm mt-1">Ecosystem-wide coverage</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-5xl font-black text-green-400 mb-2">{stats.totalBrands}</div>
            <div className="text-white text-lg font-semibold">Total Brands</div>
            <div className="text-gray-400 text-sm mt-1">Registered & verified</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-5xl font-black text-purple-400 mb-2">{stats.totalSubnodes}</div>
            <div className="text-white text-lg font-semibold">Sub-Nodes</div>
            <div className="text-gray-400 text-sm mt-1">Individual components</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
          <div className="mb-6">
            <label className="block text-white font-bold mb-3 text-lg">🔍 Search Brands & Sub-Nodes</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter brand name or sub-node..."
              className="w-full px-6 py-4 bg-black/40 border-2 border-white/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all text-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-semibold mb-2">Filter by Sector</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <option value="all">All Sectors</option>
                {Object.entries(sectorList).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Filter by Payout Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border-2 border-white/30 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <option value="all">All Tiers</option>
                <option value="A+">A+ Tier</option>
                <option value="A">A Tier</option>
                <option value="B+">B+ Tier</option>
                <option value="B">B Tier</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-white text-lg">
          <span className="font-bold text-green-400">{filteredResults.length}</span> results found
          {searchQuery && <span className="text-gray-400"> for "{searchQuery}"</span>}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResults.map((result, idx) => {
            const sector = sectorData[result.sectorKey];
            return (
              <div
                key={`${result.sectorKey}-${result.brand.name}-${idx}`}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 group"
              >
                {/* Sector Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">{sector.pricing?.glyph}</span>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">{result.sectorName}</div>
                    {sector.pricing?.payoutTier && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        sector.pricing.payoutTier === 'A+' ? 'bg-purple-500 text-white' :
                        sector.pricing.payoutTier === 'A' ? 'bg-blue-500 text-white' :
                        sector.pricing.payoutTier === 'B+' ? 'bg-green-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {sector.pricing.payoutTier}
                      </span>
                    )}
                  </div>
                </div>

                {/* Brand Name */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {result.brand.name}
                </h3>

                {/* Pricing */}
                {result.brand.masterLicensePrice && (
                  <div className="mb-4 pb-4 border-b border-white/10">
                    <div className="text-2xl font-black text-green-400">
                      {formatPrice(result.brand.masterLicensePrice)}
                    </div>
                    <div className="text-xs text-gray-400">Master License</div>
                  </div>
                )}

                {/* Sub-Nodes */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-400 mb-2">
                    {result.brand.subNodes.length} Sub-Nodes
                  </div>
                  {result.brand.subNodes.slice(0, 4).map((subnode, sidx) => {
                    const isMatched = result.matchedSubnodes.includes(subnode);
                    return (
                      <div
                        key={sidx}
                        className={`text-sm flex items-start gap-2 ${
                          isMatched ? 'text-yellow-400 font-semibold' : 'text-gray-300'
                        }`}
                      >
                        <span className={isMatched ? '✨' : '•'}></span>
                        <span className="line-clamp-1">{subnode}</span>
                      </div>
                    );
                  })}
                  {result.brand.subNodes.length > 4 && (
                    <div className="text-xs text-gray-500 italic">
                      +{result.brand.subNodes.length - 4} more...
                    </div>
                  )}
                </div>

                {/* View Button */}
                <button
                  onClick={() => {
                    window.location.href = `/hotstack#${result.sectorKey}`;
                  }}
                  className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform group-hover:scale-105"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredResults.length === 0 && searchQuery && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No results found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
