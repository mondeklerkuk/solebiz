import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import JobsPage from './pages/jobs/JobsPage';
import QuotesPage from './pages/quotes/QuotesPage';
import SourcingPage from './pages/quotes/SourcingPage';
import ClientsPage from './pages/ClientsPage';
import Settings from './pages/Settings';

type Page = 'dashboard' | 'jobs' | 'quotes' | 'sourcing' | 'clients' | 'finance' | 'settings';

const MAIN_NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Overview',  icon: '⊞' },
  { id: 'jobs',      label: 'Jobs',      icon: '🔨' },
  { id: 'quotes',    label: 'Quotes',    icon: '📋' },
  { id: 'clients',   label: 'Clients',   icon: '👥' },
];

const MORE_NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'sourcing',  label: 'Sourcing',  icon: '🏗️' },
  { id: 'finance',   label: 'Finance',   icon: '💰' },
  { id: 'settings',  label: 'Settings',  icon: '⚙' },
];

const ALL_NAV = [...MAIN_NAV, ...MORE_NAV];

function Sidebar({ page, setPage, user, signOut }: any) {
  const meta = user?.user_metadata || {};
  const biz = meta.business_name || user?.email?.split('@')[0] || 'My Business';
  const logo = meta.logo || '';
  const initial = biz.charAt(0).toUpperCase();

  return (
    <aside className="sidebar" style={{ background: 'rgba(28,28,30,0.96)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderRight: '0.5px solid rgba(255,255,255,0.08)' }}>
      <div style={{ padding: '28px 14px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 6px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>S</span>
          </div>
          <span className="sidebar-logo-text" style={{ fontSize: 'var(--text-17)', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>SoleBiz</span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {ALL_NAV.map(n => {
            const active = page === n.id;
            return (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                display:'flex', alignItems:'center', gap:10, width:'100%',
                padding:'10px 12px', borderRadius:10, border:'none',
                background: active ? 'rgba(255,255,255,0.12)' : 'none',
                color: active ? '#fff' : 'rgba(235,235,245,0.45)',
                fontSize:14, fontWeight: active ? 600 : 500,
                cursor:'pointer', position:'relative', textAlign:'left',
                fontFamily:'inherit', minHeight:44,
                transition:'all 0.15s cubic-bezier(0.25,0.46,0.45,0.94)',
              }}>
                <span style={{ fontSize:16, width:20, textAlign:'center', flexShrink:0 }}>{n.icon}</span>
                <span className="sidebar-label">{n.label}</span>
                {active && <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:2, background:'#0071E3' }} />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User tile */}
      <div style={{ padding: 14, borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }}>
          {logo
            ? <img src={logo} style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'contain', flexShrink: 0, background: '#fff' }} />
            : <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>{initial}</div>
          }
          <div style={{ flex: 1, overflow: 'hidden' }} className="sidebar-label">
            <div style={{ fontSize: 'var(--text-13)', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{biz}</div>
            <div style={{ fontSize: 11, color: 'rgba(235,235,245,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={signOut} style={{ width: '100%', padding: '8px', background: 'none', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(235,235,245,0.4)', fontSize: 'var(--text-13)', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} className="sidebar-label">
          Sign out
        </button>
      </div>
    </aside>
  );
}

function BottomTabBar({ page, setPage }: any) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isMore = MORE_NAV.some(n => n.id === page);

  return (
    <>
      <div className="tab-bar" style={{ display: 'block', position: 'fixed', bottom: 0, left: 0, right: 0, height: 83, background: 'rgba(28,28,30,0.92)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderTop: '0.5px solid rgba(255,255,255,0.15)', zIndex: 100 }}>
        <div className="tab-bar-inner">
          {MAIN_NAV.map(n => (
            <button key={n.id} className={`tab-item${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
              <span className="tab-icon" style={{ fontSize: 22 }}>{n.icon}</span>
              <span className="tab-label" style={{ color: page === n.id ? 'var(--accent-blue)' : undefined }}>{n.label}</span>
            </button>
          ))}
          <button className={`tab-item${isMore ? ' active' : ''}`} onClick={() => setMoreOpen(true)}>
            <span className="tab-icon">···</span>
            <span className="tab-label" style={{ color: isMore ? 'var(--accent-blue)' : undefined }}>More</span>
          </button>
        </div>
      </div>

      {moreOpen && (
        <>
          <div className="more-overlay" onClick={() => setMoreOpen(false)} />
          <div className={`more-sheet open`}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 'var(--text-13)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>More</div>
            {MORE_NAV.map(n => (
              <button key={n.id} onClick={() => { setPage(n.id); setMoreOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 0', border: 'none', background: 'none', color: '#fff', fontSize: 'var(--text-17)', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 22, width: 28 }}>{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function AppRoutes() {
  const { session, loading, signOut, user } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [page, setPage] = useState<Page>('dashboard');

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ fontSize: 'var(--text-24)', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '-0.5px', fontFamily: 'var(--font-display)' }}>SoleBiz</div>
    </div>
  );

  if (!session) {
    if (showSignup) return <Signup onSwitch={() => setShowSignup(false)} />;
    return <Login onSwitch={() => setShowSignup(true)} />;
  }

  const renderPage = () => {
    if (page === 'jobs')     return <JobsPage />;
    if (page === 'quotes')   return <QuotesPage />;
    if (page === 'sourcing') return <SourcingPage />;
    if (page === 'clients')  return <ClientsPage />;
    if (page === 'finance')  return <ComingSoon label="Finance" icon="💰" />;
    if (page === 'settings') return <Settings />;
    return <Dashboard onNavigate={(p: Page) => setPage(p)} />;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar page={page} setPage={setPage} user={user} signOut={signOut} />
      <main className="main-content" style={{ flex: 1, overflowY: 'auto', minHeight: '100vh', minWidth: 0 }}>
        {renderPage()}
      </main>
      <BottomTabBar page={page} setPage={setPage} />
    </div>
  );
}

function ComingSoon({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, gap: 12 }}>
      <span style={{ fontSize: 48 }}>{icon}</span>
      <h2 style={{ fontSize: 'var(--text-24)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', fontFamily: 'var(--font-display)' }}>{label}</h2>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-15)' }}>Coming soon</p>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
