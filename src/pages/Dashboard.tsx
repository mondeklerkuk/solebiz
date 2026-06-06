import { useAuth } from '../context/AuthContext';

type Page = 'dashboard' | 'jobs' | 'quotes' | 'finance' | 'settings';

const MODULES = [
  { icon: '🔨', label: 'Jobs', desc: 'Track your job pipeline', page: 'jobs' as Page, color: '#FF9500', ready: true },
  { icon: '📋', label: 'Quotes & Invoices', desc: 'Create and send documents', page: 'quotes' as Page, color: '#007AFF', ready: true },
  { icon: '💰', label: 'Finance', desc: 'Income & expenses', page: 'finance' as Page, color: '#34C759', ready: false },
  { icon: '🤖', label: 'AI Assistant', desc: 'Your business co-pilot', page: 'dashboard' as Page, color: '#AF52DE', ready: false },
];

export default function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { user } = useAuth();
  const businessName = (user?.user_metadata?.business_name as string) || 'Your Business';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.greeting}>{greeting} 👋</p>
          <h1 style={s.bizName}>{businessName}</h1>
        </div>
      </div>

      {/* Quick stats */}
      <div style={s.statsRow}>
        {[
          { label: 'Active Jobs', value: '—', color: '#FF9500' },
          { label: 'Open Quotes', value: '—', color: '#007AFF' },
          { label: 'This Month', value: '£—', color: '#34C759' },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <div style={{ ...s.statDot, background: stat.color }} />
            <div style={s.statValue}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <h2 style={s.sectionTitle}>Modules</h2>
      <div style={s.grid}>
        {MODULES.map(m => (
          <div key={m.label} style={s.moduleCard} onClick={() => onNavigate(m.page)}>
            <div style={{ ...s.moduleIcon, background: `${m.color}18` }}>
              <span style={{ fontSize: 26 }}>{m.icon}</span>
            </div>
            <div style={s.moduleLabel}>{m.label}</div>
            <div style={s.moduleDesc}>{m.desc}</div>
            {m.ready
              ? <span style={{ ...s.badge, background: '#34C75918', color: '#34C759' }}>Ready</span>
              : <span style={{ ...s.badge, background: '#8E8E9318', color: '#8E8E93' }}>Coming soon</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '32px 28px', maxWidth: 900, margin: '0 auto' },
  header: { marginBottom: 28 },
  greeting: { fontSize: 15, color: '#8E8E93', marginBottom: 4 },
  bizName: { fontSize: 28, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.5px' },
  statsRow: { display: 'flex', gap: 14, marginBottom: 32 },
  statCard: { flex: 1, background: '#fff', borderRadius: 16, padding: '20px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' },
  statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: 700, color: '#1C1C1E', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#8E8E93' },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: '#1C1C1E', marginBottom: 14, letterSpacing: '-0.3px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 },
  moduleCard: { background: '#fff', borderRadius: 16, padding: '20px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' },
  moduleIcon: { width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  moduleLabel: { fontSize: 15, fontWeight: 600, color: '#1C1C1E', marginBottom: 4 },
  moduleDesc: { fontSize: 13, color: '#8E8E93', marginBottom: 12, lineHeight: '1.4' },
  badge: { fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500, display: 'inline-block' },
};
