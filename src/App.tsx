import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import JobsPage from './pages/jobs/JobsPage';
import QuotesPage from './pages/quotes/QuotesPage';

type Page = 'dashboard' | 'jobs' | 'quotes' | 'finance' | 'settings';

const NAV = [
  { id: 'dashboard' as Page, label: 'Overview', icon: '▤' },
  { id: 'jobs' as Page, label: 'Jobs', icon: '🔨' },
  { id: 'quotes' as Page, label: 'Quotes', icon: '📋' },
  { id: 'finance' as Page, label: 'Finance', icon: '💰' },
  { id: 'settings' as Page, label: 'Settings', icon: '⚙' },
];

function Sidebar({ page, setPage, user, signOut }: any) {
  const initials = (user?.email || 'U').charAt(0).toUpperCase();
  const biz = user?.user_metadata?.business_name || 'My Business';
  return (
    <aside style={s.sidebar}>
      <div style={s.sidebarInner}>
        <div style={s.logoRow}>
          <div style={s.logoIcon}>S</div>
          <span style={s.logoText}>SoleBiz</span>
        </div>
        <nav style={s.nav}>
          {NAV.map(n => {
            const active = page === n.id;
            return (
              <button key={n.id} style={{ ...s.navBtn, ...(active ? s.navActive : {}) }} onClick={() => setPage(n.id)}>
                <span style={s.navIcon}>{n.icon}</span>
                <span>{n.label}</span>
                {active && <div style={s.navPill} />}
              </button>
            );
          })}
        </nav>
      </div>
      <div style={s.sidebarFoot}>
        <div style={s.userCard}>
          <div style={s.avatar}>{initials}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={s.userName}>{biz}</div>
            <div style={s.userEmail}>{user?.email}</div>
          </div>
        </div>
        <button style={s.signOut} onClick={signOut}>Sign out</button>
      </div>
    </aside>
  );
}

function AppRoutes() {
  const { session, loading, signOut, user } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [page, setPage] = useState<Page>('dashboard');

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, fontWeight: 800, color: '#2563EB', letterSpacing: '-1px' }}>SoleBiz</span>
    </div>
  );

  if (!session) {
    if (showSignup) return <Signup onSwitch={() => setShowSignup(false)} />;
    return <Login onSwitch={() => setShowSignup(true)} />;
  }

  const renderPage = () => {
    if (page === 'jobs') return <JobsPage />;
    if (page === 'quotes') return <QuotesPage />;
    if (page === 'finance') return <Soon label="Finance" icon="💰" />;
    if (page === 'settings') return <Soon label="Settings" icon="⚙" />;
    return <Dashboard onNavigate={setPage} />;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar page={page} setPage={setPage} user={user} signOut={signOut} />
      <main style={s.main}>{renderPage()}</main>
    </div>
  );
}

function Soon({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, gap: 12 }}>
      <span style={{ fontSize: 44 }}>{icon}</span>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>{label}</h2>
      <p style={{ color: '#94A3B8', fontSize: 15 }}>Coming soon</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 232,
    background: '#0F172A',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    height: '100vh',
    flexShrink: 0,
  },
  sidebarInner: { padding: '28px 16px 0' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, padding: '0 8px' },
  logoIcon: { width: 32, height: 32, borderRadius: 8, background: '#2563EB', color: '#fff', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2 },
  navBtn: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '10px 12px', borderRadius: 10, border: 'none',
    background: 'none', color: '#94A3B8', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', position: 'relative', textAlign: 'left',
    transition: 'color 0.15s, background 0.15s',
  },
  navActive: { background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600 },
  navIcon: { fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 },
  navPill: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, background: '#2563EB' },
  sidebarFoot: { padding: '16px' },
  userCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: 8, background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 },
  signOut: { width: '100%', padding: '8px', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#64748B', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  main: { flex: 1, overflowY: 'auto', minHeight: '100vh' },
};

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
