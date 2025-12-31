import { useState } from 'react';
import { Link } from 'react-router';
import { useCurrency } from '@/react-app/hooks/useCurrency';
import { sectorData, sectorList } from '@/worker/data/sectors';

interface License {
  id: string;
  sectorKey: string;
  brandName: string;
  licenseType: 'core' | 'subnode';
  subnode?: string;
  billingPeriod: 'monthly' | 'annual';
  price: number;
  status: 'active' | 'expired' | 'pending';
  startDate: string;
  expiryDate: string;
  autoRenew: boolean;
}

export default function UserDashboard() {
  const { formatPrice } = useCurrency();
  
  // Mock user data - in production this would come from backend
  const [userLicenses] = useState<License[]>([
    {
      id: 'LIC-001',
      sectorKey: 'banking',
      brandName: 'FinGrid',
      licenseType: 'core',
      billingPeriod: 'annual',
      price: 12500,
      status: 'active',
      startDate: '2024-01-15',
      expiryDate: '2025-01-15',
      autoRenew: true
    },
    {
      id: 'LIC-002',
      sectorKey: 'ai-logic',
      brandName: 'OmniKey',
      licenseType: 'subnode',
      subnode: 'TraceBeam™',
      billingPeriod: 'monthly',
      price: 350,
      status: 'active',
      startDate: '2024-11-01',
      expiryDate: '2024-12-01',
      autoRenew: true
    },
    {
      id: 'LIC-003',
      sectorKey: 'gaming',
      brandName: 'GameGrid',
      licenseType: 'core',
      billingPeriod: 'monthly',
      price: 670,
      status: 'pending',
      startDate: '2024-12-01',
      expiryDate: '2025-01-01',
      autoRenew: false
    }
  ]);

  const totalMonthlySpend = userLicenses
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + (l.billingPeriod === 'monthly' ? l.price : l.price / 12), 0);

  const totalAnnualSpend = userLicenses
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + (l.billingPeriod === 'annual' ? l.price : l.price * 12), 0);

  const activeLicenses = userLicenses.filter(l => l.status === 'active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="text-4xl">👤</span>
              <div>
                <h1 className="text-2xl font-black text-white">My Dashboard</h1>
                <p className="text-xs text-gray-400">Manage your licenses & subscriptions</p>
              </div>
            </Link>
            <div className="flex gap-4">
              <Link to="/brands" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all">
                Browse Brands
              </Link>
              <Link to="/hotstack" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all">
                HotStack
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-2">🎫</div>
            <div className="text-3xl font-black text-green-400 mb-1">{activeLicenses}</div>
            <div className="text-white font-semibold">Active Licenses</div>
            <div className="text-xs text-gray-400 mt-1">Currently subscribed</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-2xl font-black text-blue-400 mb-1">{formatPrice(totalMonthlySpend)}</div>
            <div className="text-white font-semibold">Monthly Spend</div>
            <div className="text-xs text-gray-400 mt-1">Current period</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-2xl font-black text-purple-400 mb-1">{formatPrice(totalAnnualSpend)}</div>
            <div className="text-white font-semibold">Annual Projection</div>
            <div className="text-xs text-gray-400 mt-1">Estimated yearly</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-2">🔄</div>
            <div className="text-3xl font-black text-orange-400 mb-1">
              {userLicenses.filter(l => l.autoRenew).length}
            </div>
            <div className="text-white font-semibold">Auto-Renew</div>
            <div className="text-xs text-gray-400 mt-1">Enabled subscriptions</div>
          </div>
        </div>

        {/* Active Licenses */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
            <span>🎯</span> Active Licenses
          </h2>

          <div className="space-y-4">
            {userLicenses.filter(l => l.status === 'active').map(license => {
              const sector = sectorData[license.sectorKey];
              return (
                <div key={license.id} className="bg-black/30 rounded-xl p-6 border border-white/10 hover:border-green-500/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{sector?.pricing?.glyph}</div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{license.brandName}</h3>
                        <div className="text-sm text-gray-400">{sectorList[license.sectorKey]}</div>
                        {license.subnode && (
                          <div className="text-sm text-yellow-400 mt-1">📌 {license.subnode}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-green-400">{formatPrice(license.price)}</div>
                      <div className="text-xs text-gray-400">{license.billingPeriod}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <div className="text-xs text-gray-400">License Type</div>
                      <div className="text-sm font-semibold text-white capitalize">{license.licenseType}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Start Date</div>
                      <div className="text-sm font-semibold text-white">{license.startDate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Renewal Date</div>
                      <div className="text-sm font-semibold text-white">{license.expiryDate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Auto-Renew</div>
                      <div className={`text-sm font-semibold ${license.autoRenew ? 'text-green-400' : 'text-orange-400'}`}>
                        {license.autoRenew ? '✓ Enabled' : '✗ Disabled'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all">
                      Manage
                    </button>
                    <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-all">
                      View Invoice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending & Expired */}
        {userLicenses.filter(l => l.status !== 'active').length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <span>⏳</span> Pending & Expired
            </h2>

            <div className="space-y-4">
              {userLicenses.filter(l => l.status !== 'active').map(license => (
                <div key={license.id} className="bg-black/30 rounded-xl p-6 border border-orange-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{license.brandName}</h3>
                      <div className="text-sm text-gray-400">{sectorList[license.sectorKey]}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        license.status === 'pending' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                      }`}>
                        {license.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <Link
            to="/brands"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl text-lg transition-all transform hover:scale-105 shadow-2xl"
          >
            ✨ Browse More Licenses
          </Link>
        </div>
      </div>
    </div>
  );
}
