import { useState, useEffect } from 'react';
import { useCurrency } from '@/react-app/hooks/useCurrency';

const SECTORS = [
  'All','agriculture','banking','creative','education-ip','education-youth',
  'fashion','fsf','gaming','health','housing','justice','knowledge','logistics',
  'media','micromesh','mining','nutrition','packaging','payroll-mining',
  'professional','quantum','ritual','saas','trade','utilities','voice',
  'webless','wildlife','zerowaste','ai-logic','admin-panel','global-index',
];

interface Brand {
  id: string;
  name: string;
  sector: string;
  masterLicensePrice: number;
  tagline?: string;
  subnodeCount?: number;
}

const MOCK_BRANDS: Brand[] = [
  { id:'b1', name:'BaobabTree™', sector:'agriculture', masterLicensePrice:4200, tagline:'Root of the Fruitful ecosystem', subnodeCount:7 },
  { id:'b2', name:'BushPortal™', sector:'agriculture', masterLicensePrice:3100, tagline:'Agri-supply chain bridge', subnodeCount:4 },
  { id:'b3', name:'SeedwaveConnect™', sector:'agriculture', masterLicensePrice:2800, tagline:'Signal network for growers', subnodeCount:3 },
  { id:'b4', name:'Banimal™', sector:'creative', masterLicensePrice:5500, tagline:'Wildlife-meets-commerce brand', subnodeCount:12 },
  { id:'b5', name:'CornexConnect™', sector:'logistics', masterLicensePrice:3900, tagline:'Grain-logistics connector', subnodeCount:5 },
  { id:'b6', name:'VaultMesh™', sector:'saas', masterLicensePrice:8800, tagline:'L7 policy enforcement layer', subnodeCount:9 },
  { id:'b7', name:'NoodleNexus™', sector:'saas', masterLicensePrice:6200, tagline:'Python orchestration core', subnodeCount:6 },
  { id:'b8', name:'ClaimRoot™', sector:'justice', masterLicensePrice:7100, tagline:'Oracle-bone immutable claims', subnodeCount:4 },
  { id:'b9', name:'HotStack™', sector:'saas', masterLicensePrice:12000, tagline:'Full-stack deployment engine', subnodeCount:20 },
  { id:'b10', name:'FAAZone™', sector:'admin-panel', masterLicensePrice:4500, tagline:'FAA-grade zone management', subnodeCount:8 },
  { id:'b11', name:'LicenseVault™', sector:'knowledge', masterLicensePrice:5800, tagline:'IP licensing infrastructure', subnodeCount:6 },
  { id:'b12', name:'WildButcher™', sector:'wildlife', masterLicensePrice:2200, tagline:'Ethical game trading platform', subnodeCount:3 },
  { id:'b13', name:'BareCart™', sector:'saas', masterLicensePrice:3300, tagline:'Grain-level commerce (1g=$0.01)', subnodeCount:5 },
  { id:'b14', name:'PulseTrade™', sector:'trade', masterLicensePrice:4700, tagline:'9-second rhythmic pulse engine', subnodeCount:7 },
  { id:'b15', name:'OmniGrid™', sector:'global-index', masterLicensePrice:9900, tagline:'7,102-brand ecosystem index', subnodeCount:33 },
];

export default function LicenseMarketplace() {
  const { currency, symbol, rates } = useCurrency();
  const [sector, setSector] = useState('All');
  const [cart, setCart] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState('');

  const filtered = sector === 'All' ? MOCK_BRANDS : MOCK_BRANDS.filter(b => b.sector === sector);

  const fmt = (usd: number) => {
    const rate = rates[currency] ?? 1;
    return `${symbol}${(usd * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const addToCart = async (brand: Brand) => {
    try {
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: brand.id, name: brand.name, price: brand.masterLicensePrice, currency: 'USD' }),
      });
    } catch {/* swallow */}
    setCart(c => ({ ...c, [brand.id]: true }));
    setNotification(`${brand.name} added to cart`);
    setTimeout(() => setNotification(''), 2500);
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          OMNIDROP · 7,102 brands · 33 sectors
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--text-primary)', margin: 0 }}>
          License Marketplace
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Acquire master licences for Fruitful™ ecosystem brands. One-time fee, perpetual deployment rights.
        </p>
      </header>

      {/* Sector filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {SECTORS.map(s => (
          <button
            key={s}
            onClick={() => setSector(s)}
            style={{
              padding: '0.3rem 0.9rem',
              borderRadius: 20,
              border: '1px solid',
              borderColor: sector === s ? 'var(--teal)' : 'var(--border)',
              background: sector === s ? 'var(--teal)' : 'transparent',
              color: sector === s ? 'var(--text-on-teal)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          background: 'var(--teal)', color: 'var(--text-on-teal)',
          padding: '0.6rem 1rem', borderRadius: 8, marginBottom: '1rem',
          fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600,
        }}>
          {notification}
        </div>
      )}

      {/* Brand grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filtered.map(brand => (
          <div key={brand.id} style={{
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
                  {brand.name}
                </h3>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                  background: 'var(--surface-2)', color: 'var(--teal)',
                  padding: '0.2rem 0.55rem', borderRadius: 10, border: '1px solid var(--border)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {brand.sector}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.4rem' }}>
                {brand.tagline}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {brand.subnodeCount} subnodes
              </span>
              <span style={{
                marginLeft: 'auto', fontFamily: 'var(--font-serif)',
                fontSize: '1.1rem', fontWeight: 700, color: 'var(--yellow)',
              }}>
                {fmt(brand.masterLicensePrice)}
              </span>
            </div>

            <button
              onClick={() => addToCart(brand)}
              disabled={cart[brand.id]}
              style={{
                padding: '0.55rem 1rem',
                background: cart[brand.id] ? 'var(--surface-2)' : 'var(--teal)',
                color: cart[brand.id] ? 'var(--teal)' : 'var(--text-on-teal)',
                border: cart[brand.id] ? '1px solid var(--teal)' : 'none',
                borderRadius: 8, cursor: cart[brand.id] ? 'default' : 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700,
                transition: 'background 0.2s',
              }}
            >
              {cart[brand.id] ? 'In Cart ✓' : 'Add to Cart'}
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '3rem 0' }}>
          No brands in this sector yet.
        </p>
      )}
    </div>
  );
}
