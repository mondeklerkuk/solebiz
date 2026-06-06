import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import JobsPage from './pages/jobs/JobsPage';
import QuotesPage from './pages/quotes/QuotesPage';

type Page = 'dashboard' | 'jobs' | 'quotes' | 'finance' | 'settings';

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Home', icon: '⊞' },
  { id: 'jobs', label: 'Jobs', icon: '🔨' },
  { id: 'quotes', label: 'Quotes', icon: '📋' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function AppRoutes() {
  const { session, loading, signOut, user } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [page, setPage] = useState<Page>('dashboard');

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F7' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#007AFF', letterSpacing: '-0.5px' }}>SoleBiz</div>
    </div>
  );

  if (!session) {
    if (showSignup) return <Signup onSwitch={() => setShowSignup(false)} />;
    return <Login onSwitch={() => setShowSignup(true)} />;
  }

  const renderPage = () => {
    if (page === 'jobs') return <JobsPage />;
    if (page === 'quotes') return <QuotesPage />;
    if (page === 'finance') return <ComingSoon label="Finance" icon="💰" />;
    if (page === 'settings') return <ComingSoon label="Settings" icon="⚙️" />;
    return <Dashboard onNavigate={setPage} />;
  };

  const initials = (user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F2F2F7' }}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.logo}>SoleBiz</div>
          <nav style={s.nav}>
            {NAV.map(n => (
              <button key={n.id} style={{ ...s.navItem, ...(page === n.id ? s.navActive : {}) }} onClick={() => setPage(n.id)}>
                <span style={s.navIcon}>{n.icon}</span>
                <span style={s.navLabel}>{n.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div style={s.sidebarBottom}>
          <div style={s.userRow}>
            <div style={s.avatar}>{initials}</div>
            <div style={s.userInfo}>
              <div style={s.userName}>{user?.user_metadata?.business_name || 'My Business'}</div>
              <div style={s.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button style={s.signOutBtn} onClick={signOut}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>{renderPage()}</div>
    </div>
  );
}

function ComingSoon({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1E', marginBottom: 8 }}>{label}</h2>
      <p style={{ color: '#8E8E93', fontSize: 15 }}>Coming soon</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '24px 12px',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  sidebarTop: { display: 'flex', flexDirection: 'column', gap: 8 },
  logo: { fontSize: 22, fontWeight: 700, color: '#007AFF', padding: '4px 12px', marginBottom: 16, letterSpacing: '-0.5px' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 10, border: 'none',
    background: 'none', cursor: 'pointer', fontSize: 14,
    color: '#3C3C43', textAlign: 'left', width: '100%',
    transition: 'background 0.15s',
  },
  navActive: { background: '#007AFF15', color: '#007AFF', fontWeight: 600 },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  navLabel: { fontSize: 14 },
  sidebarBottom: { display: 'flex', flexDirection: 'column', gap: 12 },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F2F2F7', borderRadius: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17, background: '#007AFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 },
  userInfo: { flex: 1, overflow: 'hidden' },
  userName: { fontSize: 13, fontWeight: 600, color: '#1C1C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: 11, color: '#8E8E93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  signOutBtn: { background: 'none', border: 'none', color: '#8E8E93', fontSize: 13, cursor: 'pointer', padding: '4px 12px', textAlign: 'left' },
  main: { flex: 1, overflowY: 'auto', minHeight: '100vh' },
};

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
