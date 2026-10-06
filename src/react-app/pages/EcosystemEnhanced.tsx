import { useState } from 'react';

interface SectorBrand {
  name: string;
  subnodes: string[];
  revenue?: string;
}

interface Sector {
  key: string;
  label: string;
  color: string;
  brands: SectorBrand[];
  insight: string;
}

const SECTORS: Sector[] = [
  {
    key: 'agriculture', label: 'Agriculture', color: '#30B6A9',
    brands: [
      { name: 'BaobabTree™', subnodes: ['BaobabPulse', 'RootVault', 'SoilSignal', 'HarvestLink', 'GrainTrack', 'CropMesh', 'YieldBot'], revenue: '$12.4M' },
      { name: 'BushPortal™', subnodes: ['BushSync', 'FieldGate', 'AgriVault', 'CropChain'], revenue: '$8.1M' },
      { name: 'SeedwaveConnect™', subnodes: ['SeedPulse', 'NestSignal', 'GrowthMesh'], revenue: '$5.3M' },
    ],
    insight: 'Agriculture sector shows 34% YoY growth driven by grain-level commerce (BareCart™ integration) and the SeedwaveConnect pulse network reaching 1,200+ smallholders.',
  },
  {
    key: 'saas', label: 'SaaS', color: '#F7CA12',
    brands: [
      { name: 'HotStack™', subnodes: ['WorkerAPI', 'D1Schema', 'R2Intake', 'VaultMeshL7', 'PulseGrid', 'OmniDrop', 'BareCart', 'ReactSPA', 'GitHubCI', 'AdminPanel', 'FileScroll', 'SyncBridge', 'CurrencyAPI', 'SpotifyAPI', 'MochaHub', 'GeminiAI', 'DropZone', 'FAAGlobal', 'SynergyHub', 'CartAPI'], revenue: '$89.2M' },
      { name: 'VaultMesh™', subnodes: ['PolicyEngine', 'CollapseToken', 'AES256Layer', 'L7Router', 'RPS-Guard', 'SnapshotStore', 'FolderVault', 'SyncPulse', 'AuditLog'], revenue: '$41.5M' },
      { name: 'NoodleNexus™', subnodes: ['PulseTrade', 'ClaimRoot', 'BareCart', 'CrateLogic', 'Store40D', 'SyncBridge', 'SeedwaveCore'], revenue: '$28.7M' },
      { name: 'BareCart™', subnodes: ['GrainEngine', 'CartAPI', 'CurrencyRouter', 'OrderVault', 'PriceOracle'], revenue: '$19.3M' },
    ],
    insight: 'SaaS is the ecosystem anchor. HotStack™ alone handles 180-second deployment windows across 7,102 brands. VaultMesh™ L7 COLLAPSE tokens active on 3 policy tiers.',
  },
  {
    key: 'banking', label: 'Banking', color: '#EE3050',
    brands: [
      { name: 'FAAVaultPay™', subnodes: ['Paystack', 'Stripe', 'PayPal', 'PayFast', 'Alipay', 'Bybit', 'CryptoCom'], revenue: '$67.8M' },
      { name: 'BankingPortal™', subnodes: ['TransactionMesh', 'VaultLedger', 'ComplianceNode'], revenue: '$23.1M' },
    ],
    insight: 'Banking sector leads in transaction volume. FAAVaultPay™ processes 7 payment rails simultaneously. ZAR dominates by transaction count (South African primary market).',
  },
  {
    key: 'creative', label: 'Creative', color: '#931A3F',
    brands: [
      { name: 'Banimal™', subnodes: ['SamFox', 'WildBrush', 'CreatureMint', 'PackScript', 'BoxDesign', 'BrandPulse', 'RetailKit', 'StudioVault', 'PrintMesh', 'ColorNode', 'TypoBase', 'ArtCore'], revenue: '$33.6M' },
    ],
    insight: 'Banimal™ drives creative sector with the SamFox™ CI sub-brand. The Ink/Sage/Mint/Coral/DustyRose palette targets premium retail print packaging.',
  },
  {
    key: 'logistics', label: 'Logistics', color: '#209388',
    brands: [
      { name: 'CornexConnect™', subnodes: ['GrainRouter', 'CrateLogic', 'ShipVault', 'TrackPulse', 'LoadMesh'], revenue: '$14.2M' },
      { name: 'ZeroWaste™', subnodes: ['BlockBox', 'EPSSystem', 'TearBridge', 'CNCProfile'], revenue: '$7.8M' },
    ],
    insight: 'Logistics benefiting from ZeroWaste™ BlockBox™ patent-pending system: 94% packaging waste reduction, 40–60% shipping cost reduction for EPS cornice profiles.',
  },
  {
    key: 'wildlife', label: 'Wildlife', color: '#1E9F97',
    brands: [
      { name: 'WildButcher™', subnodes: ['GameTrade', 'EthicsNode', 'ColdChain'], revenue: '$4.1M' },
      { name: 'WildlifePortal™', subnodes: ['ConservationVault', 'TrackingMesh', 'HabitatSignal'], revenue: '$3.2M' },
    ],
    insight: 'Wildlife sector underpins South African primary-market commitment. Ethical sourcing verified on-chain via ClaimRoot™ oracle-bone records.',
  },
  {
    key: 'global-index', label: 'Global Index', color: '#E63946',
    brands: [
      { name: 'OmniGrid™', subnodes: Array.from({length: 33}, (_, i) => `Sector-${i+1}`) , revenue: '$210M TAM' },
    ],
    insight: 'OmniGrid™ is the master index — 7,102 brands, 33 sectors, 12 Seedwave subdomains. 180-second deployment window via HotStack™ Worker CI pipeline.',
  },
];

export default function EcosystemEnhanced() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedBrand, setExpandedBrand] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setExpanded(e => ({ ...e, [key]: !e[key] }));
  const toggleBrand = (key: string) => setExpandedBrand(e => ({ ...e, [key]: !e[key] }));

  const totalBrands = SECTORS.reduce((s, sec) => s + sec.brands.length, 0);

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '2.5rem' }}>
        <p style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          FRUITFUL™ ECOSYSTEM · 33 sectors · 7,102 brands
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--text-primary)', margin: 0 }}>
          Ecosystem Explorer
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Full sector breakdown with brands, subnodes, revenue signals, and AI insights.
        </p>
      </header>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {[
          { label: 'Sectors', value: '33' },
          { label: 'Brands (sample)', value: String(totalBrands) },
          { label: 'Total Ecosystem', value: '7,102' },
          { label: 'Pulse Heartbeat', value: '9s' },
          { label: 'Deployment Window', value: '180s' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '0.75rem 1.1rem', minWidth: 100,
          }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--yellow)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Sector accordions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {SECTORS.map(sector => (
          <div key={sector.key} style={{
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {/* Sector header */}
            <button
              onClick={() => toggle(sector.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1.1rem 1.4rem', background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: sector.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--text-primary)', flex: 1 }}>
                {sector.label}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {sector.brands.length} brand{sector.brands.length !== 1 ? 's' : ''}
              </span>
              <span style={{ color: expanded[sector.key] ? sector.color : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', transition: 'color 0.15s' }}>
                {expanded[sector.key] ? '▲' : '▼'}
              </span>
            </button>

            {/* Expanded content */}
            {expanded[sector.key] && (
              <div style={{ padding: '0 1.4rem 1.4rem', borderTop: '1px solid var(--border)' }}>
                {/* AI Insight */}
                <div style={{
                  background: 'var(--surface-2)', borderLeft: `3px solid ${sector.color}`,
                  borderRadius: 6, padding: '0.75rem 1rem', margin: '1rem 0',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: sector.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                    AI Insight · Gemini 2.5 Flash
                  </div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    {sector.insight}
                  </p>
                </div>

                {/* Brands */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
                  {sector.brands.map(brand => (
                    <div key={brand.name} style={{
                      background: 'var(--surface-0)', border: '1px solid var(--border-soft)',
                      borderRadius: 10, overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => toggleBrand(`${sector.key}:${brand.name}`)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.75rem 1rem', background: 'transparent', border: 'none',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.92rem', color: 'var(--text-primary)', flex: 1 }}>
                          {brand.name}
                        </span>
                        {brand.revenue && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--yellow)', flexShrink: 0 }}>
                            {brand.revenue}
                          </span>
                        )}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {brand.subnodes.length} nodes {expandedBrand[`${sector.key}:${brand.name}`] ? '▲' : '▼'}
                        </span>
                      </button>

                      {expandedBrand[`${sector.key}:${brand.name}`] && (
                        <div style={{ padding: '0.5rem 1rem 0.9rem', borderTop: '1px solid var(--border-soft)' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {brand.subnodes.map(n => (
                              <span key={n} style={{
                                fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
                                background: 'var(--surface-1)', color: sector.color,
                                border: `1px solid ${sector.color}33`,
                                padding: '0.2rem 0.55rem', borderRadius: 10,
                              }}>
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', marginTop: '2rem', textAlign: 'center' }}>
        Showing {SECTORS.length} of 33 sectors · {totalBrands} key brands · Full 7,102 brand index via OmniGrid™
      </p>
    </div>
  );
}
