import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import '../styles/fruitful.css';

const NAV_LINKS = [
  { to: '/',           label: 'Home' },
  { to: '/ecosystem',  label: 'Ecosystem' },
  { to: '/brands',     label: 'Brands' },
  { to: '/drop-zone',  label: 'Drop Zone' },
  { to: '/vault',      label: 'Vault' },
  { to: '/cart',       label: 'Cart' },
  { to: '/dashboard',  label: 'Dashboard' },
];

function PearLogo() {
  return (
    <span className="pear-logo" aria-hidden="true">
      <span className="pear-stem" />
      <span className="pear-leaf" />
      <span className="pear-top" />
      <span className="pear-body" />
    </span>
  );
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  return (
    <div className="surface-0" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Sticky Nav ─────────────────────────────────────── */}
      <nav className="hs-nav" role="navigation" aria-label="Main navigation">
        <Link to="/" className="hs-nav-brand" onClick={() => setMenuOpen(false)}>
          <PearLogo />
          <span>HotStack™</span>
        </Link>

        <ul className="hs-nav-links" role="list">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={isActive(to) ? 'active' : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/admin/dashboard" className="hs-nav-pill">
            ⚡ Admin
          </Link>
          <button
            className="hs-burger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* ── Mobile Nav ─────────────────────────────────────── */}
      <div className={`hs-mobile-nav${menuOpen ? ' is-open' : ''}`} role="menu">
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            role="menuitem"
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </Link>
        ))}
        <Link
          to="/admin/dashboard"
          role="menuitem"
          style={{ color: 'var(--teal)', fontWeight: 700 }}
          onClick={() => setMenuOpen(false)}
        >
          ⚡ Admin
        </Link>
      </div>

      {/* ── Page Content ───────────────────────────────────── */}
      <main style={{ flex: 1, background: 'var(--surface-0)' }}>
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="hs-footer">
        <div>
          Fruitful™ Ecosystem&nbsp;·&nbsp;VaultMesh™ L7&nbsp;·&nbsp;PulseGrid™ 9s
        </div>
        <div style={{ marginTop: '0.25rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Genesis Signal: </span>
          <span style={{ color: 'var(--yellow)' }}>SEEDWAVE-011-CORE</span>
          <span style={{ color: 'var(--text-muted)' }}> · Priority lock active</span>
        </div>
        <div style={{ marginTop: '0.25rem' }}>
          © {new Date().getFullYear()} Fruitful Shops · Proprietary Licence v1.1 · All rights reserved
        </div>
      </footer>
    </div>
  );
}
