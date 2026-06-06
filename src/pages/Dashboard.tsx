import { useAuth } from '../context/AuthContext';

type Page = 'dashboard' | 'jobs' | 'quotes' | 'finance' | 'settings';

const MODULES = [
  { icon: '🔨', label: 'Jobs', desc: 'Manage your job pipeline', page: 'jobs' as Page, status: 'Ready' },
  { icon: '📋', label: 'Quotes & Invoices', desc: 'Create and send quotes', page: 'quotes' as Page, status: 'Coming next' },
  { icon: '💰', label: 'Finance', desc: 'Track income & expenses', page: 'finance' as Page, status: 'Phase 1' },
  { icon: '🤖', label: 'AI Assistant', desc: 'Your business co-pilot', page: 'dashboard' as Page, status: 'Phase 1' },
];

export default function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { user } = useAuth();
  const businessName = (user?.user_metadata?.business_name as string) || 'Your Business';

  return (
    <div style={s.container}>
      <div style={s.welcome}>
        <p style={s.greeting}>Welcome back 👋</p>
        <h2 style={s.bizName}>{businessName}</h2>
        <p style={s.email}>{user?.email}</p>
      </div>
      <h3 style={s.sectionTitle}>Modules</h3>
      <div style={s.grid}>
        {MODULES.map(m => (
          <div key={m.label} style={s.card} onClick={() => onNavigate(m.page)}>
            <div style={s.icon}>{m.icon}</div>
            <div style={s.cardLabel}>{m.label}</div>
            <div style={s.cardDesc}>{m.desc}</div>
            <span style={{ ...s.badge, ...(m.status === 'Ready' ? s.badgeReady : {}) }}>{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { padding: 24, maxWidth: 900, margin: '0 auto' },
  welcome: { background: '#1A56DB', borderRadius: 16, padding: 24, marginBottom: 24 },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: '0 0 4px' },
  bizName: { color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 2px' },
  email: { color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', border: '1px solid #F3F4F6', transition: 'box-shadow 0.15s' },
  icon: { fontSize: 28, marginBottom: 10 },
  cardLabel: { fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  badge: { fontSize: 11, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: 20 },
  badgeReady: { color: '#15803D', background: '#F0FDF4' },
};
