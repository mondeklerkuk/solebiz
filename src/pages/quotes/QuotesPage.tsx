import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import QuoteModal from './QuoteModal';

export const QUOTE_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft:    { bg: '#F8FAFC', text: '#1E293B', border: '#E2E8F0' },
  sent:     { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  viewed:   { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  accepted: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  declined: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  invoiced: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  paid:     { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
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
  const [filter, setFilter] = useState<'all' | 'quotes' | 'invoices'>('all');

  useEffect(() => { if (user) { fetchQuotes(); fetchClients(); } }, [user]);

  async function fetchQuotes() {
    setLoading(true);
    const { data } = await supabase
      .from('quotes')
      .select('*, client:clients(name, email, phone)')
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
        <div style={s.stat}>
          <div style={s.statLabel}>Total Value</div>
          <div style={s.statValue}>£{totalValue.toFixed(2)}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Paid</div>
          <div style={{ ...s.statValue, color: '#15803D' }}>£{paidValue.toFixed(2)}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Outstanding</div>
          <div style={{ ...s.statValue, color: '#C2410C' }}>£{(totalValue - paidValue).toFixed(2)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filters}>
        {(['all', 'quotes', 'invoices'] as const).map(f => (
          <button key={f} style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={s.loading}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p>No documents yet. Create your first quote!</p>
        </div>
      ) : (
        <div style={s.table}>
          <div style={s.tableHeader}>
            <span>Number</span><span>Client</span><span>Date</span><span>Total</span><span>Status</span><span></span>
          </div>
          {filtered.map(q => {
            const col = QUOTE_STATUS_COLORS[q.status];
            return (
              <div key={q.id} style={s.tableRow} onClick={() => { setEditingQuote(q); setModalOpen(true); }}>
                <span style={s.quoteNum}>{q.quote_number}</span>
                <span style={s.clientName}>{q.client?.name || '—'}</span>
                <span style={s.date}>{new Date(q.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span style={s.amount}>£{(q.total || 0).toFixed(2)}</span>
                <span style={{ ...s.badge, background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                  {q.is_invoice ? '🧾 ' : '📋 '}{QUOTE_STATUS_LABELS[q.status]}
                </span>
                <span style={s.arrow}>›</span>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <QuoteModal
          quote={editingQuote}
          clients={clients}
          userId={user.id}
          userEmail={user.email || ''}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); fetchQuotes(); }}
        />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(16px,4vw,36px) clamp(14px,4vw,40px)', maxWidth: 1000, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 },
  subtitle: { fontSize: 14, color: '#64748B', margin: '4px 0 0' },
  addBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  statsRow: { display: 'flex', flexWrap: 'wrap' as any, gap: 12, marginBottom: 20 },
  stat: { flex: 1, background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 700, color: '#0F172A' },
  filters: { display: 'flex', gap: 8, marginBottom: 16 },
  filterBtn: { padding: '6px 16px', borderRadius: 20, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748B' },
  filterActive: { background: '#2563EB', color: '#fff', border: '1px solid #1A56DB' },
  loading: { textAlign: 'center', color: '#64748B', padding: 48 },
  empty: { textAlign: 'center', color: '#94A3B8', padding: 48 },
  table: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tableHeader: { display: 'grid', gridTemplateColumns: '120px 1fr 120px 100px 130px 24px', gap: 12, padding: '12px 20px', background: '#F8FAFC', fontSize: 12, fontWeight: 600, color: '#64748B', borderBottom: '1px solid #F3F4F6' },
  tableRow: { display: 'grid', gridTemplateColumns: '120px 1fr 120px 100px 130px 24px', gap: 12, padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid #F9FAFB', cursor: 'pointer' },
  quoteNum: { fontSize: 13, fontWeight: 600, color: '#2563EB' },
  clientName: { fontSize: 14, color: '#0F172A' },
  date: { fontSize: 13, color: '#64748B' },
  amount: { fontSize: 14, fontWeight: 600, color: '#0F172A' },
  badge: { fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 500, display: 'inline-block' },
  arrow: { fontSize: 18, color: '#94A3B8', textAlign: 'center' },
};
