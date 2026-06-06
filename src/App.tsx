import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import JobsPage from './pages/jobs/JobsPage';

type Page = 'dashboard' | 'jobs' | 'quotes' | 'finance' | 'settings';

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Home', icon: '🏠' },
  { id: 'jobs', label: 'Jobs', icon: '🔨' },
  { id: 'quotes', label: 'Quotes', icon: '📋' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function AppRoutes() {
  const { session, loading, signOut } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [page, setPage] = useState<Page>('dashboard');

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
      <div style={{ color: '#1A56DB', fontSize: 18, fontWeight: 600 }}>SoleBiz</div>
    </div>
  );

  if (!session) {
    if (showSignup) return <Signup onSwitch={() => setShowSignup(false)} />;
    return <Login onSwitch={() => setShowSignup(true)} />;
  }

  const renderPage = () => {
    if (page === 'jobs') return <JobsPage />;
    if (page === 'quotes') return <ComingSoon label="Quotes & Invoices" />;
    if (page === 'finance') return <ComingSoon label="Finance" />;
    if (page === 'settings') return <ComingSoon label="Settings" />;
    return <Dashboard onNavigate={setPage} />;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>SoleBiz</div>
        <nav style={s.nav}>
          {NAV.map(n => (
            <button
              key={n.id}
              style={{ ...s.navItem, ...(page === n.id ? s.navActive : {}) }}
              onClick={() => setPage(n.id)}
            >
              <span style={s.navIcon}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <button style={s.signOutBtn} onClick={signOut}>Sign out</button>
      </div>

      {/* Main content */}
      <div style={s.main}>{renderPage()}</div>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🚧</div>
      <h2 style={{ color: '#111827', marginBottom: 8 }}>{label}</h2>
      <p style={{ color: '#6B7280' }}>Coming next!</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: { width: 220, background: '#fff', borderRight: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', padding: '24px 12px' },
  sidebarLogo: { fontSize: 20, fontWeight: 700, color: '#1A56DB', padding: '0 12px', marginBottom: 24 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#6B7280', textAlign: 'left', width: '100%' },
  navActive: { background: '#EFF6FF', color: '#1A56DB', fontWeight: 600 },
  navIcon: { fontSize: 16 },
  signOutBtn: { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer', padding: '10px 12px', textAlign: 'left' },
  main: { flex: 1, overflowY: 'auto' },
};

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
