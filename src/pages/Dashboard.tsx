import { useAuth } from '../context/AuthContext';

type Page = 'dashboard' | 'jobs' | 'quotes' | 'finance' | 'settings';

const STATS = [
  { label: 'Active Jobs', value: '—', color: '#2563EB', bg: '#EFF6FF' },
  { label: 'Open Quotes', value: '—', color: '#10B981', bg: '#ECFDF5' },
  { label: 'Revenue', value: '£—', color: '#8B5CF6', bg: '#F5F3FF' },
  { label: 'Outstanding', value: '£—', color: '#F59E0B', bg: '#FFFBEB' },
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
      <div style={s.topBar}>
        <div>
          <p style={s.greeting}>{greeting} 👋</p>
          <h1 style={s.heading}>{biz}</h1>
        </div>
        <div style={s.dateBadge}>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
      </div>

      <div style={s.statsGrid}>
        {STATS.map(stat => (
          <div key={stat.label} style={s.statCard}>
            <div style={{ ...s.statDot, background: stat.color }} />
            <div style={s.statValue}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>Modules</h2>
      </div>
      <div style={s.modulesGrid}>
        {MODULES.map(m => (
          <div key={m.label} style={{ ...s.moduleCard, ...(!m.ready ? s.moduleDisabled : {}) }} onClick={() => m.ready && onNavigate(m.page)}>
            <div style={{ ...s.moduleIconWrap, background: `${m.color}12` }}>
              <span style={{ fontSize: 22 }}>{m.icon}</span>
            </div>
            <div style={s.moduleInfo}>
              <div style={s.moduleLabel}>{m.label}</div>
              <div style={s.moduleDesc}>{m.desc}</div>
            </div>
            <span style={{ ...s.badge, ...(m.ready ? { background: '#ECFDF5', color: '#059669' } : { background: '#F1F5F9', color: '#94A3B8' }) }}>
              {m.ready ? '● Live' : 'Soon'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 40px)', maxWidth: 960, margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  greeting: { fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' },
  heading: { fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px' },
  dateBadge: { fontSize: 13, fontWeight: 600, color: '#64748B', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 14px', whiteSpace: 'nowrap' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 36 },
  statCard: { background: '#fff', borderRadius: 16, padding: '20px 18px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 14 },
  statValue: { fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-1px', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: 500, color: '#94A3B8' },
  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' },
  modulesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 },
  moduleCard: { display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer' },
  moduleDisabled: { opacity: 0.5, cursor: 'default' },
  moduleIconWrap: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  moduleInfo: { flex: 1, minWidth: 0 },
  moduleLabel: { fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px', marginBottom: 2 },
  moduleDesc: { fontSize: 12, color: '#94A3B8', fontWeight: 500 },
  badge: { fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap' },
};
