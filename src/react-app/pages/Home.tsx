import { Link } from 'react-router';
import '@/react-app/styles/fruitful.css';

const QUICK_LINKS = [
  { to: '/drop-zone',   label: 'Drop Zone',   accent: 'var(--teal)'   },
  { to: '/brands',      label: 'Brands',      accent: 'var(--yellow)' },
  { to: '/marketplace', label: 'Marketplace', accent: 'var(--pink)'   },
  { to: '/vault',       label: 'Vault',       accent: 'var(--darkteal)' },
  { to: '/dashboard',   label: 'Dashboard',   accent: 'var(--maroon)' },
  { to: '/ecosystem',   label: 'Ecosystem',   accent: 'var(--rteal)'  },
  { to: '/cart',        label: 'Cart',        accent: 'var(--yellow)' },
  { to: '/faa-global',  label: 'FAA Global',  accent: 'var(--red)'    },
];

const STATS = [
  { value: '7,102', label: 'Brands' },
  { value: '33',    label: 'Sectors' },
  { value: '50',    label: 'API Endpoints' },
  { value: '12',    label: 'D1 Tables' },
  { value: '9s',    label: 'Pulse Interval' },
  { value: '180s',  label: 'Deploy Window' },
];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-0)', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
      {/* Hero */}
      <section style={{ padding: 'clamp(3rem, 8vw, 7rem) 1.5rem clamp(2rem, 6vw, 5rem)', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
        {/* Pear mark */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <svg width="56" height="72" viewBox="0 0 56 72" fill="none" aria-hidden="true">
            <ellipse cx="28" cy="46" rx="22" ry="26" fill="var(--teal)" opacity=".9"/>
            <ellipse cx="28" cy="24" rx="13" ry="16" fill="var(--darkteal)"/>
            <path d="M28 8 C30 2 36 2 34 8" stroke="var(--yellow)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <ellipse cx="22" cy="12" rx="6" ry="3.5" fill="var(--teal)" transform="rotate(-30 22 12)" opacity=".7"/>
          </svg>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--teal)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Fruitful™ Ecosystem · HotStack™ · VaultMesh™ L7 · PulseGrid™
        </div>

        <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', lineHeight: 1.1, marginBottom: '1.25rem', textWrap: 'balance' }}>
          The Ultimate<br />
          <span style={{ color: 'var(--teal)' }}>Ecosystem</span> Engine
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 2rem' }}>
          HotStack™ unifies 7,102 brands across 33 sectors on a single Cloudflare Worker with D1 SQLite, R2 storage, and a 9-second VaultMesh™ heartbeat. One platform. Infinite reach.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/ecosystem" style={{
            padding: '0.7rem 1.6rem', background: 'var(--teal)', color: 'var(--text-on-teal)',
            borderRadius: 8, textDecoration: 'none', fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem', fontWeight: 700,
          }}>
            Explore Ecosystem
          </Link>
          <Link to="/drop-zone" style={{
            padding: '0.7rem 1.6rem', background: 'transparent', color: 'var(--yellow)',
            border: '1px solid var(--yellow)', borderRadius: 8, textDecoration: 'none',
            fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700,
          }}>
            OmniDrop
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface-1)', padding: '1.5rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
          {STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center', padding: '0.75rem 1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--yellow)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.2rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section style={{ padding: 'clamp(2rem, 6vw, 4rem) 1.5rem', maxWidth: 960, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '1.25rem', textAlign: 'center' }}>
          Quick Access
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {QUICK_LINKS.map(({ to, label, accent }) => (
            <Link key={to} to={to} style={{
              display: 'block', padding: '1.1rem', background: 'var(--surface-1)',
              border: `1px solid ${accent}44`, borderRadius: 12, textDecoration: 'none',
              textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: '0.92rem',
              color: accent, transition: 'background 0.15s, border-color 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.borderColor = accent; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-1)'; (e.currentTarget as HTMLElement).style.borderColor = `${accent}44`; }}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Genesis signal footer strip */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Genesis Signal&nbsp;
          <span style={{ color: 'var(--yellow)' }}>SEEDWAVE-011-CORE</span>
          &nbsp;·&nbsp;Priority lock active&nbsp;·&nbsp;
          <span style={{ color: 'var(--teal)' }}>NexusNair PulseGrid™</span>
          &nbsp;heartbeat: 1,247,892 pulses
        </p>
      </section>
    </div>
  );
}
