import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import QuoteModal from './QuoteModal';
import DocumentViewer from './DocumentViewer';

export const QUOTE_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft:    { bg: '#F1F5F9', text: '#475569',  border: '#CBD5E1' },
  sent:     { bg: '#EFF6FF', text: '#2563EB',  border: '#BFDBFE' },
  viewed:   { bg: '#FFFBEB', text: '#D97706',  border: '#FDE68A' },
  accepted: { bg: '#F0FDF4', text: '#16A34A',  border: '#BBF7D0' },
  declined: { bg: '#FEF2F2', text: '#DC2626',  border: '#FECACA' },
  invoiced: { bg: '#F5F3FF', text: '#7C3AED',  border: '#DDD6FE' },
  paid:     { bg: '#ECFDF5', text: '#059669',  border: '#6EE7B7' },
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
  const [tab, setTab] = useState<'quotes' | 'invoices'>('quotes');

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

  const allQuotes = quotes.filter(q => !q.is_invoice);
  const allInvoices = quotes.filter(q => q.is_invoice);

  // Quote stats
  const quotesTotal = allQuotes.reduce((s, q) => s + (q.total || 0), 0);
  const quotesSent = allQuotes.filter(q => ['sent','viewed'].includes(q.status)).length;
  const quotesAccepted = allQuotes.filter(q => q.status === 'accepted').length;

  // Invoice stats
  const invoicesPaid = allInvoices.filter(q => q.status === 'paid').reduce((s, q) => s + (q.total || 0), 0);
  const invoicesOutstanding = allInvoices.filter(q => q.status !== 'paid').reduce((s, q) => s + (q.total || 0), 0);
  const invoicesOverdue = allInvoices.filter(q =>
    q.status !== 'paid' && q.due_date && new Date(q.due_date) < new Date()
  ).length;

  const filtered = tab === 'quotes' ? allQuotes : allInvoices;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Quotes & Invoices</h1>
          <p style={s.subtitle}>Create quotes, convert to invoices, track payments</p>
        </div>
        <button style={s.addBtn} onClick={() => { setEditingQuote(null); setModalOpen(true); }}>
          + New {tab === 'quotes' ? 'Quote' : 'Invoice'}
        </button>
      </div>

      {/* Tab switcher */}
      <div style={s.tabs}>
        <button style={{ ...s.tabBtn, ...(tab === 'quotes' ? s.tabActive : {}) }} onClick={() => setTab('quotes')}>
          📋 Quotes
          {allQuotes.length > 0 && <span style={{ ...s.tabCount, background: tab === 'quotes' ? '#2563EB' : '#E2E8F0', color: tab === 'quotes' ? '#fff' : '#64748B' }}>{allQuotes.length}</span>}
        </button>
        <button style={{ ...s.tabBtn, ...(tab === 'invoices' ? s.tabActive : {}) }} onClick={() => setTab('invoices')}>
          🧾 Invoices
          {allInvoices.length > 0 && <span style={{ ...s.tabCount, background: tab === 'invoices' ? '#2563EB' : '#E2E8F0', color: tab === 'invoices' ? '#fff' : '#64748B' }}>{allInvoices.length}</span>}
        </button>
      </div>

      {/* Stats — different for quotes vs invoices */}
      {tab === 'quotes' ? (
        <div style={s.statsRow}>
          <StatCard label="Total Quotes" value={String(allQuotes.length)} sub="all time" color="#2563EB" />
          <StatCard label="Awaiting Response" value={String(quotesSent)} sub="sent or viewed" color="#D97706" />
          <StatCard label="Accepted" value={String(quotesAccepted)} sub="approved by client" color="#16A34A" />
          <StatCard label="Total Value" value={`£${quotesTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="across all quotes" color="#7C3AED" />
        </div>
      ) : (
        <div style={s.statsRow}>
          <StatCard label="Paid" value={`£${invoicesPaid.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="collected" color="#059669" />
          <StatCard label="Outstanding" value={`£${invoicesOutstanding.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="awaiting payment" color={invoicesOutstanding > 0 ? '#D97706' : '#059669'} />
          <StatCard label="Overdue" value={String(invoicesOverdue)} sub={invoicesOverdue === 0 ? 'none overdue' : 'past due date'} color={invoicesOverdue > 0 ? '#DC2626' : '#059669'} />
          <StatCard label="Total Invoiced" value={String(allInvoices.length)} sub="invoices raised" color="#2563EB" />
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div style={s.loading}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{tab === 'quotes' ? '📋' : '🧾'}</div>
          <div style={s.emptyTitle}>No {tab} yet</div>
          <p style={s.emptyDesc}>
            {tab === 'quotes'
              ? 'Create your first quote to send to a client.'
              : 'Convert an accepted quote to an invoice, or create one directly.'}
          </p>
          <button style={s.emptyBtn} onClick={() => { setEditingQuote(null); setModalOpen(true); }}>
            + Create {tab === 'quotes' ? 'Quote' : 'Invoice'}
          </button>
        </div>
      ) : (
        <div style={s.table}>
          <div style={s.tableHeader}>
            <span style={{ flex: '0 0 130px' }}>#</span>
            <span style={{ flex: 1 }}>Client</span>
            <span style={{ flex: '0 0 90px' }}>Date</span>
            <span style={{ flex: '0 0 110px', textAlign: 'right' }}>Amount</span>
            <span style={{ flex: '0 0 110px', textAlign: 'center' }}>Status</span>
            <span style={{ flex: '0 0 80px', textAlign: 'center' }}>Actions</span>
          </div>
          {filtered.map(q => {
            const col = QUOTE_STATUS_COLORS[q.status] || QUOTE_STATUS_COLORS.draft;
            const isOverdue = q.is_invoice && q.status !== 'paid' && q.due_date && new Date(q.due_date) < new Date();
            return (
              <div key={q.id} style={s.tableRow}>
                <span style={{ flex: '0 0 130px' }}>
                  <span style={s.docNum}>{q.quote_number}</span>
                </span>
                <span style={{ flex: 1, fontSize: 14, color: '#0F172A', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.client?.name || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No client</span>}
                </span>
                <span style={{ flex: '0 0 90px', fontSize: 13, color: '#64748B' }}>
                  {new Date(q.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {isOverdue && <span style={s.overduePip}>!</span>}
                </span>
                <span style={{ flex: '0 0 110px', fontSize: 15, fontWeight: 700, color: '#0F172A', textAlign: 'right' }}>
                  £{(q.total || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ flex: '0 0 110px', textAlign: 'center' }}>
                  <span style={{ ...s.badge, background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                    {QUOTE_STATUS_LABELS[q.status]}
                  </span>
                </span>
                <div style={{ flex: '0 0 80px', display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <button style={s.actionBtn} title="Preview & Send" onClick={() => setViewingQuote(q)}>📤</button>
                  <button style={s.actionBtn} title="Edit" onClick={() => { setEditingQuote(q); setModalOpen(true); }}>✏️</button>
                </div>
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
          defaultInvoice={tab === 'invoices'}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); fetchQuotes(); }}
        />
      )}

      {viewingQuote && (
        <DocumentViewer
          quote={viewingQuote}
          client={viewingQuote.client}
          userProfile={{
            business_name: user?.user_metadata?.business_name || 'My Business',
            email: user?.email,
            phone: user?.user_metadata?.phone,
            address: user?.user_metadata?.address,
          }}
          onClose={() => { setViewingQuote(null); fetchQuotes(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={sc.card}>
      <div style={{ ...sc.dot, background: color }} />
      <div style={{ ...sc.value, color }}>{value}</div>
      <div style={sc.label}>{label}</div>
      <div style={sc.sub}>{sub}</div>
    </div>
  );
}

const sc: Record<string, React.CSSProperties> = {
  card: { flex: '1 1 140px', background: '#fff', borderRadius: 14, padding: '18px 18px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 12 },
  value: { fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 2 },
  label: { fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 },
  sub: { fontSize: 12, color: '#94A3B8' },
};

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,40px)', maxWidth: 1000, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12 },
  title: { fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px' },
  subtitle: { fontSize: 13, color: '#94A3B8', fontWeight: 400, marginTop: 4 },
  addBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: '#F1F5F9', borderRadius: 12, padding: 4, width: 'fit-content' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#64748B', fontFamily: 'inherit', transition: 'all 0.15s' },
  tabActive: { background: '#fff', color: '#0F172A', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  tabCount: { fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20, minWidth: 20, textAlign: 'center' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 },
  loading: { textAlign: 'center', color: '#94A3B8', padding: 48, fontWeight: 500 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#64748B', lineHeight: 1.6, maxWidth: 360, marginBottom: 24 },
  emptyBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  table: { background: '#fff', borderRadius: 16, border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' },
  tableHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' },
  tableRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F8FAFC' },
  docNum: { fontSize: 13, fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' },
  overduePip: { display: 'inline-flex', width: 16, height: 16, background: '#DC2626', color: '#fff', borderRadius: 8, fontSize: 10, fontWeight: 800, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  badge: { fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap' },
  actionBtn: { width: 32, height: 32, border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: 8, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },
};
