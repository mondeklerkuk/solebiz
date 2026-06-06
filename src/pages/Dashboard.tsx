import { useAuth } from '../context/AuthContext';

type Page = 'dashboard' | 'jobs' | 'quotes' | 'finance' | 'settings';

const STATS = [
  { label: 'Active Jobs', value: '—', change: '', color: '#2563EB', bg: '#EFF6FF' },
  { label: 'Open Quotes', value: '—', change: '', color: '#10B981', bg: '#ECFDF5' },
  { label: 'Revenue This Month', value: '£—', change: '', color: '#8B5CF6', bg: '#F5F3FF' },
  { label: 'Outstanding', value: '£—', change: '', color: '#F59E0B', bg: '#FFFBEB' },
];

const MODULES = [
  { icon: '🔨', label: 'Jobs', desc: 'Track your pipeline', page: 'jobs' as Page, color: '#2563EB', ready: true },
  { icon: '📋', label: 'Quotes & Invoices', desc: 'Bills & documents', page: 'quotes' as Page, color: '#10B981', ready: true },
  { icon: '💰', label: 'Finance', desc: 'P&L and expenses', page: 'finance' as Page, color: '#8B5CF6', ready: false },
  { icon: '🤖', label: 'AI Assistant', desc: 'Business co-pilot', page: 'dashboard' as Page, color: '#F59E0B', ready: false },
];

export default function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { user } = useAuth();
  const biz = (user?.user_metadata?.business_name as string) || 'Your Business';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <div>
          <p style={s.greeting}>{greeting} 👋</p>
          <h1 style={s.heading}>{biz}</h1>
        </div>
        <div style={s.dateBadge}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>

      {/* Stats row */}
      <div style={s.statsGrid}>
        {STATS.map(stat => (
          <div key={stat.label} style={s.statCard}>
            <div style={{ ...s.statIcon, background: stat.bg }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: stat.color }} />
            </div>
            <div style={s.statValue}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>Modules</h2>
        <span style={s.sectionSub}>Click to open</span>
      </div>
      <div style={s.modulesGrid}>
        {MODULES.map(m => (
          <div key={m.label} style={{ ...s.moduleCard, ...(m.ready ? {} : s.moduleDisabled) }} onClick={() => m.ready && onNavigate(m.page)}>
            <div style={{ ...s.moduleIconWrap, background: `${m.color}12`, border: `1px solid ${m.color}20` }}>
              <span style={{ fontSize: 24 }}>{m.icon}</span>
            </div>
            <div style={s.moduleInfo}>
              <div style={s.moduleLabel}>{m.label}</div>
              <div style={s.moduleDesc}>{m.desc}</div>
            </div>
            <div style={{ ...s.moduleBadge, ...(m.ready ? { background: '#ECFDF5', color: '#059669' } : { background: '#F1F5F9', color: '#94A3B8' }) }}>
              {m.ready ? '● Live' : 'Soon'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '36px 40px', maxWidth: 960, margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  greeting: { fontSize: 13, fontWeight: 500, color: '#94A3B8', marginBottom: 4, letterSpacing: '0.02em', textTransform: 'uppercase' },
  heading: { fontSize: 30, fontWeight: 800, color: '#0F172A', letterSpacing: '-1px' },
  dateBadge: { fontSize: 13, fontWeight: 500, color: '#64748B', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 },
  statCard: { background: '#fff', borderRadius: 16, padding: '22px 20px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  statIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  statValue: { fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-1px', marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: 500, color: '#94A3B8' },
  sectionHeader: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.5px' },
  sectionSub: { fontSize: 13, color: '#94A3B8' },
  modulesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  moduleCard: { display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.1s' },
  moduleDisabled: { opacity: 0.55, cursor: 'default' },
  moduleIconWrap: { width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  moduleInfo: { flex: 1 },
  moduleLabel: { fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px', marginBottom: 2 },
  moduleDesc: { fontSize: 13, color: '#94A3B8', fontWeight: 500 },
  moduleBadge: { fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, flexShrink: 0 },
};
