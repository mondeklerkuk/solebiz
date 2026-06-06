import { useAuth } from '../context/AuthContext';

type Page = 'dashboard' | 'jobs' | 'quotes' | 'sourcing' | 'clients' | 'finance' | 'settings';

const MODULES = [
  { icon: '🔨', label: 'Jobs', desc: 'Track your pipeline', page: 'jobs' as Page, color: '#2563EB', ready: true },
  { icon: '📋', label: 'Quotes & Invoices', desc: 'Bills & documents', page: 'quotes' as Page, color: '#10B981', ready: true },
  { icon: '🏗️', label: 'Sourcing', desc: 'Find materials & prices', page: 'sourcing' as Page, color: '#8B5CF6', ready: true },
  { icon: '👥', label: 'Clients', desc: 'Manage your clients', page: 'clients' as Page, color: '#F59E0B', ready: true },
  { icon: '💰', label: 'Finance', desc: 'P&L and expenses', page: 'finance' as Page, color: '#EF4444', ready: false },
];

export default function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { user } = useAuth();
  const meta = user?.user_metadata || {};
  const biz = (meta.business_name as string) || 'Your Business';
  const logo = meta.logo as string;
  const email = meta.email || user?.email || '';
  const phone = meta.phone as string;
  const address = [meta.address, meta.city, meta.postcode].filter(Boolean).join(', ');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const hasProfile = !!(meta.business_name);

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <div style={s.bizInfo}>
          {logo && (
            <img src={logo} style={{ height: 56, maxWidth: 160, objectFit: 'contain', borderRadius: 10, background: '#fff', padding: 4, border: '1px solid #E2E8F0' }} />
          )}
          <div>
            <p style={s.greeting}>{greeting} 👋</p>
            <h1 style={s.heading}>{biz}</h1>
            {(email || phone) && <p style={s.bizContact}>{[email, phone].filter(Boolean).join(' · ')}</p>}
            {address && <p style={s.bizContact}>{address}</p>}
          </div>
        </div>
        <div style={s.topRight}>
          <div style={s.dateBadge}>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
          {!hasProfile && (
            <button style={s.setupBtn} onClick={() => onNavigate('settings')}>
              ⚙ Set up business profile
            </button>
          )}
        </div>
      </div>

      {!hasProfile && (
        <div style={s.setupBanner}>
          <span style={{ fontSize: 20 }}>👋</span>
          <div>
            <div style={s.bannerTitle}>Complete your business profile</div>
            <div style={s.bannerSub}>Add your business name, logo and contact details — they'll appear on all your quotes and invoices.</div>
          </div>
          <button style={s.bannerBtn} onClick={() => onNavigate('settings')}>Set up now →</button>
        </div>
      )}

      <div style={s.statsGrid}>
        {[
          { label: 'Active Jobs', value: '—', color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Open Quotes', value: '—', color: '#10B981', bg: '#ECFDF5' },
          { label: 'Revenue This Month', value: '£—', color: '#8B5CF6', bg: '#F5F3FF' },
          { label: 'Outstanding', value: '£—', color: '#F59E0B', bg: '#FFFBEB' },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: stat.color, marginBottom: 14 }} />
            <div style={s.statValue}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <h2 style={s.sectionTitle}>Modules</h2>
      <div style={s.modulesGrid}>
        {MODULES.map(m => (
          <div key={m.label} style={{ ...s.moduleCard, ...(!m.ready ? { opacity: 0.5, cursor: 'default' } : {}) }}
            onClick={() => m.ready && onNavigate(m.page)}>
            <div style={{ ...s.moduleIcon, background: `${m.color}12` }}>
              <span style={{ fontSize: 22 }}>{m.icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={s.moduleLabel}>{m.label}</div>
              <div style={s.moduleDesc}>{m.desc}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap', background: m.ready ? '#ECFDF5' : '#F1F5F9', color: m.ready ? '#059669' : '#94A3B8' }}>
              {m.ready ? '● Live' : 'Soon'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(16px,4vw,36px) clamp(14px,4vw,40px)', maxWidth: 960, margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  bizInfo: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  greeting: { fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 },
  heading: { fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px', marginBottom: 4 },
  bizContact: { fontSize: 13, color: '#64748B', fontWeight: 500 },
  topRight: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  dateBadge: { fontSize: 13, fontWeight: 600, color: '#64748B', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 14px', whiteSpace: 'nowrap' },
  setupBtn: { fontSize: 13, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit' },
  setupBanner: { display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(135deg,#EFF6FF,#F5F3FF)', border: '1px solid #BFDBFE', borderRadius: 14, padding: '16px 20px', marginBottom: 24, flexWrap: 'wrap' },
  bannerTitle: { fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 2 },
  bannerSub: { fontSize: 13, color: '#64748B' },
  bannerBtn: { marginLeft: 'auto', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 32 },
  statCard: { background: '#fff', borderRadius: 16, padding: '20px 18px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  statValue: { fontSize: 'clamp(22px,4vw,28px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-1px', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: 500, color: '#94A3B8' },
  sectionTitle: { fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px', marginBottom: 14 },
  modulesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 },
  moduleCard: { display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer' },
  moduleIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  moduleLabel: { fontSize: 15, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px', marginBottom: 2 },
  moduleDesc: { fontSize: 12, color: '#94A3B8', fontWeight: 500 },
};
