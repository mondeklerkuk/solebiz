import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import QuoteModal from './QuoteModal';
import DocumentViewer from './DocumentViewer';

export const QUOTE_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft:    { bg: 'var(--bg-primary)', text: 'var(--text-primary)', border: 'rgba(142,142,147,0.2)' },
  sent:     { bg: 'rgba(0,113,227,0.12)', text: 'var(--accent-blue)', border: 'rgba(0,113,227,0.3)' },
  viewed:   { bg: 'rgba(255,159,10,0.12)', text: 'var(--accent-orange)', border: 'rgba(255,159,10,0.3)' },
  accepted: { bg: 'rgba(48,209,88,0.12)', text: 'var(--accent-green)', border: 'rgba(48,209,88,0.3)' },
  declined: { bg: 'rgba(255,59,48,0.12)', text: 'var(--accent-red)', border: 'rgba(255,59,48,0.3)' },
  invoiced: { bg: 'rgba(191,90,242,0.12)', text: 'var(--accent-purple)', border: 'rgba(191,90,242,0.3)' },
  paid:     { bg: 'rgba(48,209,88,0.12)', text: 'var(--accent-green)', border: 'rgba(48,209,88,0.3)' },
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', viewed: 'Viewed',
  accepted: 'Accepted', declined: 'Declined', invoiced: 'Invoiced', paid: 'Paid',
};

export default function QuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [viewingQuote, setViewingQuote] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'quotes' | 'invoices'>('all');

  useEffect(() => { if (user) { fetchQuotes(); fetchClients(); } }, [user]);

  async function fetchQuotes() {
    setLoading(true);
    const { data } = await supabase
      .from('quotes')
      .select('*, client:clients(id,name,email,phone,address)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setQuotes(data || []);
    setLoading(false);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name');
    setClients(data || []);
  }

  const filtered = quotes.filter(q => {
    if (filter === 'quotes') return !q.is_invoice;
    if (filter === 'invoices') return q.is_invoice;
    return true;
  });

  const totalValue = filtered.reduce((sum, q) => sum + (q.total || 0), 0);
  const paidValue = filtered.filter(q => q.status === 'paid').reduce((sum, q) => sum + (q.total || 0), 0);
  const outstanding = totalValue - paidValue;

  const userProfile = {
    business_name: user?.user_metadata?.business_name || 'My Business',
    email: user?.email,
    phone: user?.user_metadata?.phone,
    address: user?.user_metadata?.address,
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Quotes & Invoices</h1>
          <p style={s.subtitle}>{filtered.length} document{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={s.addBtn} onClick={() => { setEditingQuote(null); setModalOpen(true); }}>+ New Quote</button>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        {[
          { label: 'Total Value', value: `£${totalValue.toFixed(2)}`, color: 'var(--text-primary)' },
          { label: 'Paid', value: `£${paidValue.toFixed(2)}`, color: '#059669' },
          { label: 'Outstanding', value: `£${outstanding.toFixed(2)}`, color: outstanding > 0 ? '#D97706' : '#059669' },
        ].map(st => (
          <div key={st.label} style={s.stat}>
            <div style={s.statLabel}>{st.label}</div>
            <div style={{ ...s.statValue, color: st.color }}>{st.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={s.filters}>
        {(['all', 'quotes', 'invoices'] as const).map(f => (
          <button key={f} style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.loading}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>
          <span style={{ fontSize: 40 }}>📋</span>
          <p style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>No documents yet. Create your first quote!</p>
        </div>
      ) : (
        <div style={s.table}>
          {/* Header */}
          <div style={s.tableHeader}>
            <span style={{ flex: '0 0 120px' }}>Number</span>
            <span style={{ flex: 1 }}>Client</span>
            <span style={{ flex: '0 0 110px', display: window.innerWidth < 600 ? 'none' : 'block' }}>Date</span>
            <span style={{ flex: '0 0 100px', textAlign: 'right' }}>Amount</span>
            <span style={{ flex: '0 0 110px' }}>Status</span>
            <span style={{ flex: '0 0 100px', textAlign: 'center' }}>Actions</span>
          </div>
          {filtered.map(q => {
            const col = QUOTE_STATUS_COLORS[q.status] || QUOTE_STATUS_COLORS.draft;
            return (
              <div key={q.id} style={s.tableRow} onClick={() => { setEditingQuote(q); setModalOpen(true); }}>
                <span style={{ flex: '0 0 120px', fontSize: 'var(--text-13)', fontWeight: 700, color: 'var(--accent-blue)' }}>{q.quote_number}</span>
                <span style={{ flex: 1, fontSize: 'var(--text-13)', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.client?.name || '—'}
                </span>
                <span style={{ flex: '0 0 110px', fontSize: 'var(--text-13)', color: 'var(--text-tertiary)', display: window.innerWidth < 600 ? 'none' : 'block' }}>
                  {new Date(q.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
                <span style={{ flex: '0 0 100px', fontSize: 'var(--text-13)', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                  £{(q.total || 0).toFixed(2)}
                </span>
                <span style={{ flex: '0 0 110px' }}>
                  <span style={{ ...s.badge, background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                    {q.is_invoice ? '🧾 ' : '📋 '}{QUOTE_STATUS_LABELS[q.status]}
                  </span>
                </span>
                <div style={{ flex: '0 0 100px', display: 'flex', gap: 6, justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                  <button style={s.viewBtn} onClick={() => setViewingQuote(q)} title="Preview & Send">
                    📤
                  </button>
                  <button style={s.editBtn} onClick={() => { setEditingQuote(q); setModalOpen(true); }} title="Edit">
                    ✏️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {modalOpen && (
        <QuoteModal quote={editingQuote} clients={clients} userId={user.id} userEmail={user.email || ''}
          onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchQuotes(); }} />
      )}

      {/* Document viewer + share */}
      {viewingQuote && (
        <DocumentViewer
          quote={viewingQuote}
          client={viewingQuote.client}
          userProfile={userProfile}
          onClose={() => { setViewingQuote(null); fetchQuotes(); }}
        />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,40px)', maxWidth: 960, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12 },
  title: { fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.8px' },
  subtitle: { fontSize: 'var(--text-13)', color: 'var(--text-tertiary)', fontWeight: 500, marginTop: 4 },
  addBtn: { background: 'var(--accent-blue)', color: 'var(--bg-card)', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 'var(--text-13)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  statsRow: { display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 24 },
  stat: { flex: '1 1 140px', background: 'var(--bg-card)', borderRadius: 14, padding: '18px 20px', border: '1px solid #F1F5F9', boxShadow: 'var(--shadow-card)' },
  statLabel: { fontSize: 'var(--text-11)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' },
  statValue: { fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, letterSpacing: '-0.8px' },
  filters: { display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  filterBtn: { padding: '7px 18px', borderRadius: 20, border: '1.5px solid #E2E8F0', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 'var(--text-13)', fontWeight: 600, color: 'var(--text-secondary)' },
  filterActive: { background: 'var(--text-primary)', color: 'var(--bg-card)', border: '1.5px solid #0F172A' },
  loading: { textAlign: 'center', color: 'var(--text-tertiary)', padding: 48, fontWeight: 500 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0' },
  table: { background: 'var(--bg-card)', borderRadius: 16, border: '1px solid #F1F5F9', boxShadow: 'var(--shadow-card)', overflow: 'hidden' },
  tableHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'var(--bg-primary)', borderBottom: '1px solid #E2E8F0', fontSize: 'var(--text-11)', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.06em' },
  tableRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer', transition: 'background 0.1s' },
  badge: { fontSize: 'var(--text-11)', padding: '3px 10px', borderRadius: 20, fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap' },
  viewBtn: { width: 32, height: 32, border: '1px solid #E2E8F0', background: '#EFF6FF', borderRadius: 8, cursor: 'pointer', fontSize: 'var(--text-13)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 32, height: 32, border: '1px solid #E2E8F0', background: 'var(--bg-primary)', borderRadius: 8, cursor: 'pointer', fontSize: 'var(--text-13)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
