import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type Page = 'dashboard'|'jobs'|'quotes'|'sourcing'|'clients'|'finance'|'settings';

const MODULES = [
  { icon: '🔨', label: 'Jobs',            desc: 'Track your pipeline',      page: 'jobs'     as Page, color: '#0071E3', ready: true  },
  { icon: '📋', label: 'Quotes & Invoices',desc: 'Bills & documents',       page: 'quotes'   as Page, color: '#30D158', ready: true  },
  { icon: '🏗️', label: 'Sourcing',        desc: 'Find materials & prices',  page: 'sourcing' as Page, color: '#BF5AF2', ready: true  },
  { icon: '👥', label: 'Clients',          desc: 'Manage your clients',      page: 'clients'  as Page, color: '#FF9F0A', ready: true  },
  { icon: '💰', label: 'Finance',          desc: 'P&L and expenses',         page: 'finance'  as Page, color: '#FF3B30', ready: false },
];

export default function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { user } = useAuth();
  const meta = user?.user_metadata || {};
  const biz   = (meta.business_name as string) || 'Your Business';
  const logo  = meta.logo as string;
  const email = meta.email || user?.email || '';
  const phone = meta.phone as string;
  const addr  = [meta.address, meta.city, meta.postcode].filter(Boolean).join(', ');

  const [stats, setStats] = useState({ jobs: 0, quotes: 0, revenue: 0, outstanding: 0 });
  const [loaded, setLoaded] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('jobs').select('id,status').eq('user_id', user.id),
      supabase.from('quotes').select('total,status,is_invoice').eq('user_id', user.id),
    ]).then(([{ data: jobs }, { data: quotes }]) => {
      const activeJobs = (jobs || []).filter(j => !['completed','archived'].includes(j.status)).length;
      const openQuotes = (quotes || []).filter(q => !q.is_invoice && ['draft','sent'].includes(q.status)).length;
      const revenue    = (quotes || []).filter(q => q.status === 'paid').reduce((s,q) => s + (q.total||0), 0);
      const outstanding= (quotes || []).filter(q => q.is_invoice && q.status !== 'paid').reduce((s,q) => s + (q.total||0), 0);
      setStats({ jobs: activeJobs, quotes: openQuotes, revenue, outstanding });
      setLoaded(true);
    });
  }, [user]);

  const KPIS = [
    { label: 'Active Jobs',    value: loaded ? String(stats.jobs)                    : '—', color: 'var(--accent-blue)',   bg: 'rgba(0,113,227,0.1)'   },
    { label: 'Open Quotes',   value: loaded ? String(stats.quotes)                  : '—', color: 'var(--accent-green)',  bg: 'rgba(48,209,88,0.1)'   },
    { label: 'Revenue',       value: loaded ? `£${stats.revenue.toLocaleString('en-GB',{minimumFractionDigits:0})}` : '£—', color: 'var(--accent-purple)', bg: 'rgba(191,90,242,0.1)'  },
    { label: 'Outstanding',   value: loaded ? `£${stats.outstanding.toLocaleString('en-GB',{minimumFractionDigits:0})}` : '£—', color: 'var(--accent-orange)', bg: 'rgba(255,159,10,0.1)'  },
  ];

  const hasProfile = !!(meta.business_name);

  return (
    <div className="page-pad" style={{ padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,40px)', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Hero header ── */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 'var(--text-13)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.01em' }}>
          {greeting} 👋 · {dateStr}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {logo && (
            <img src={logo} style={{ height: 52, maxWidth: 140, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--separator)', background: 'rgba(255,255,255,0.8)', padding: 6 }} />
          )}
          <div>
            <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: 'var(--font-display)' }}>
              {biz}
            </h1>
            {(email || phone) && (
              <p style={{ fontSize: 'var(--text-13)', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 400 }}>
                {[email, phone].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Setup banner */}
      {!hasProfile && (
        <div className="fade-up glass-card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: 'rgba(0,113,227,0.08)', border: '1px solid rgba(0,113,227,0.2)' }}>
          <span style={{ fontSize: 24 }}>👋</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-15)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Complete your business profile</div>
            <div style={{ fontSize: 'var(--text-13)', color: 'var(--text-secondary)' }}>Add your name, logo and contact info — they'll appear on all quotes & invoices</div>
          </div>
          <button className="btn-primary" onClick={() => onNavigate('settings')} style={{ flexShrink: 0, fontSize: 'var(--text-13)', padding: '9px 16px' }}>
            Set up →
          </button>
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="stats-grid fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 36 }}>
        {KPIS.map((k, i) => (
          <div key={k.label} className="glass-card fade-up" style={{ padding: '20px 18px', animationDelay: `${i*60}ms` }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: k.color, marginBottom: 14, boxShadow: `0 0 8px ${k.color}80` }} />
            <div style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-rounded)', lineHeight: 1.1, marginBottom: 4 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 'var(--text-13)', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modules ── */}
      <h2 className="fade-up" style={{ fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 14, fontFamily: 'var(--font-display)' }}>
        Modules
      </h2>
      <div className="modules-grid fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
        {MODULES.map((m, i) => (
          <div key={m.label} className={`glass-card fade-up${m.ready ? '' : ''}`}
            style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14, cursor: m.ready ? 'pointer' : 'default', opacity: m.ready ? 1 : 0.5, animationDelay: `${(i+4)*60}ms` }}
            onClick={() => m.ready && onNavigate(m.page)}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${m.color}20` }}>
              <span style={{ fontSize: 22 }}>{m.icon}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-17)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 2, fontFamily: 'var(--font-display)' }}>{m.label}</div>
              <div style={{ fontSize: 'var(--text-13)', color: 'var(--text-secondary)' }}>{m.desc}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, background: m.ready ? 'rgba(48,209,88,0.12)' : 'rgba(174,174,178,0.15)', color: m.ready ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
              {m.ready ? '● Live' : 'Soon'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
