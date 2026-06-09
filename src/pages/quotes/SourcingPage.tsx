import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Result {
  title: string;
  source: string;
  snippet: string;
  price: string;
  link: string;
  delivery: string;
}

const SUGGESTIONS = [
  'copper pipe 22mm', 'plasterboard 12.5mm', 'OSB board 18mm',
  'PVC conduit 20mm', 'decking boards hardwood', 'thermal insulation 100mm',
  'cement 25kg bags', 'roof tiles concrete', 'scaffolding hire',
  'tile adhesive', 'exterior paint 10L', 'chainsaw bar oil',
];

const SUPPLIERS = ['Screwfix', 'Toolstation', 'Travis Perkins', 'B&Q Trade', 'Amazon', 'HSS Hire'];

// Parse a price string like "£18.99 per 3m length" → number
function parsePrice(priceStr: string): number {
  const m = priceStr?.match(/£([\d,]+\.?\d*)/);
  return m ? parseFloat(m[1].replace(',', '')) : 0;
}

export default function SourcingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [saved, setSaved] = useState<Result[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<string>('new');
  const [newQuoteTitle, setNewQuoteTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true); setError(''); setResults([]); setAnalysis(null); setSearched(true);
    try {
      const res = await fetch('/api/source', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResults(parsed.results || []);
      setAnalysis(parsed.analysis || null);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('403')) {
        setError('API authentication error. Please check your Anthropic API key in Vercel settings.');
      } else {
        setError('Search failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleSave(r: Result) {
    setSaved(prev =>
      prev.some(s => s.link === r.link)
        ? prev.filter(s => s.link !== r.link)
        : [...prev, r]
    );
  }

  async function openAddToQuote() {
    // Load existing quotes for this user
    const { data } = await supabase
      .from('quotes')
      .select('id, quote_number, client:clients(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setQuotes(data || []);
    setSelectedQuote('new');
    setNewQuoteTitle(query ? `Materials – ${query}` : 'Sourced Materials');
    setAddModal(true);
  }

  async function handleAddToQuote() {
    if (saved.length === 0) return;
    setAdding(true);
    try {
      let quoteId = selectedQuote;

      // Create a new quote if needed
      if (selectedQuote === 'new') {
        const year = new Date().getFullYear();
        const { data: existing } = await supabase
          .from('quotes')
          .select('quote_number')
          .eq('user_id', user.id)
          .like('quote_number', `Q-${year}-%`);
        const nums = (existing || []).map((q: any) => parseInt(q.quote_number?.split('-')[2] || '0'));
        const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
        const qNum = `Q-${year}-${String(next).padStart(3, '0')}`;

        const subtotal = saved.reduce((sum, r) => sum + parsePrice(r.price), 0);
        const { data: newQ } = await supabase.from('quotes').insert({
          user_id: user.id,
          quote_number: qNum,
          status: 'draft',
          is_invoice: false,
          issue_date: new Date().toISOString().split('T')[0],
          notes: `Materials sourced via SoleBiz Sourcing.\n\nSearch: "${query}"\n\nItems include links to supplier websites for reference.`,
          subtotal,
          vat_rate: 20,
          vat_amount: subtotal * 0.2,
          total: subtotal * 1.2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).select().single();
        quoteId = newQ?.id;
      }

      if (!quoteId) throw new Error('No quote selected');

      // Add each saved item as a line item
      const lineItems = saved.map((item, idx) => ({
        quote_id: quoteId,
        description: `${item.title} (${item.source}) — ${item.link}`,
        quantity: 1,
        unit_price: parsePrice(item.price),
        total: parsePrice(item.price),
        sort_order: idx,
      }));

      await supabase.from('quote_items').insert(lineItems);

      // If adding to existing quote, update its totals
      if (selectedQuote !== 'new') {
        const { data: existingItems } = await supabase
          .from('quote_items')
          .select('total')
          .eq('quote_id', quoteId);
        const subtotal = (existingItems || []).reduce((s: number, i: any) => s + (i.total || 0), 0);
        await supabase.from('quotes').update({
          subtotal,
          vat_amount: subtotal * 0.2,
          total: subtotal * 1.2,
          updated_at: new Date().toISOString(),
        }).eq('id', quoteId);
      }

      setAddModal(false);
      setAddedMsg(`✓ ${saved.length} item${saved.length > 1 ? 's' : ''} added to quote! Go to Quotes to view.`);
      setSaved([]);
      setTimeout(() => setAddedMsg(''), 6000);
    } catch (err: any) {
      setError('Failed to add to quote: ' + err.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.hdr}>
        <h1 style={s.title}>Sourcing</h1>
        <p style={s.sub}>Find materials & prices from UK trade suppliers</p>
      </div>

      {/* Success banner */}
      {addedMsg && (
        <div style={s.successBanner}>
          <span>{addedMsg}</span>
          <button style={s.successBtn} onClick={() => onNavigate?.('quotes')}>View Quotes →</button>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <div style={s.searchBox}>
          <span style={{ fontSize: 18, color: '#94A3B8', flexShrink: 0 }}>🔍</span>
          <input
            style={s.searchInp}
            placeholder="Search for materials, tools, equipment…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={loading} style={{ ...s.searchBtn, opacity: loading ? 0.7 : 1 }}>
            {loading ? '…' : 'Search'}
          </button>
        </div>
        <div style={s.chips}>
          {SUGGESTIONS.map(sg => (
            <button key={sg} type="button" style={s.chip} onClick={() => setQuery(sg)}>{sg}</button>
          ))}
        </div>
      </form>

      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      {loading && (
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <p style={{ fontSize: 15, color: '#64748B', marginTop: 16 }}>
            Searching UK suppliers for <strong>"{query}"</strong>…
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          {/* AI Analysis */}
          {analysis && (
            <div style={s.analysisBanner}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🤖</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Analysis</span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 10 }}>{analysis.summary}</p>
              <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: '#2563EB' }}>Top pick: </span>
                <span style={{ color: '#0F172A' }}>{analysis.topPick}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {analysis.tips?.map((t: string, i: number) => (
                  <div key={i} style={{ fontSize: 13, color: '#64748B' }}>💡 {t}</div>
                ))}
              </div>
            </div>
          )}

          {/* Results grid */}
          <div style={s.grid}>
            {results.map((r, i) => (
              <div key={i} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={s.sourceTag}>{r.source}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>{r.price}</span>
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', lineHeight: 1.4, marginBottom: 6 }}>{r.title}</h3>
                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, flex: 1, marginBottom: 6 }}>{r.snippet}</p>
                {r.delivery && <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginBottom: 8 }}>🚚 {r.delivery}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={r.link} target="_blank" rel="noopener noreferrer" style={s.visitBtn}>Visit ↗</a>
                  <button
                    style={{ ...s.saveBtn, ...(saved.some(sv => sv.link === r.link) ? s.savedBtn : {}) }}
                    onClick={() => toggleSave(r)}
                  >
                    {saved.some(sv => sv.link === r.link) ? '✓ Saved' : '+ Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Saved items panel */}
          {saved.length > 0 && (
            <div style={s.savedPanel}>
              <div style={s.savedHeader}>
                <div>
                  <h3 style={s.savedTitle}>📌 Saved Items ({saved.length})</h3>
                  <p style={s.savedSub}>Ready to add to a quote as line items with supplier links</p>
                </div>
                <button style={s.addToQuoteBtn} onClick={openAddToQuote}>
                  + Add to Quote
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {saved.map((item, i) => (
                  <div key={i} style={s.savedRow}>
                    <span style={s.sourceTag}>{item.source}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', flexShrink: 0 }}>{item.price}</span>
                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#2563EB', fontWeight: 600, flexShrink: 0, textDecoration: 'none' }}>↗</a>
                    <button style={s.removeBtn} onClick={() => toggleSave(item)}>✕</button>
                  </div>
                ))}
              </div>
              <div style={s.savedTotal}>
                <span style={{ color: '#64748B', fontSize: 13 }}>Estimated total (ex. VAT)</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  £{saved.reduce((sum, r) => sum + parsePrice(r.price), 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div style={s.emptyCenter}>
          <span style={{ fontSize: 40 }}>🔎</span>
          <p style={{ color: '#64748B', marginTop: 12 }}>No results. Try a different search.</p>
        </div>
      )}

      {!searched && (
        <div style={s.emptyCenter}>
          <span style={{ fontSize: 52, marginBottom: 16, display: 'block' }}>🏗️</span>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Find the best prices on materials</h3>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, maxWidth: 420, marginBottom: 24 }}>
            Search for any material, tool or equipment. Save items and add them directly to a quote as line items with supplier links.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {SUPPLIERS.map(sp => (
              <span key={sp} style={s.supplierChip}>{sp}</span>
            ))}
          </div>
        </div>
      )}

      {/* Add to Quote modal */}
      {addModal && (
        <div style={m.overlay} onClick={e => e.target === e.currentTarget && setAddModal(false)}>
          <div style={m.modal}>
            <div style={m.hdr}>
              <h2 style={m.title}>Add to Quote</h2>
              <button style={m.x} onClick={() => setAddModal(false)}>✕</button>
            </div>

            <div style={m.body}>
              {/* Summary of items */}
              <div style={m.itemsSummary}>
                <div style={m.itemsSummaryTitle}>{saved.length} item{saved.length > 1 ? 's' : ''} to add</div>
                {saved.map((item, i) => (
                  <div key={i} style={m.summaryRow}>
                    <span style={m.summaryName}>{item.title}</span>
                    <span style={m.summaryPrice}>{item.price}</span>
                  </div>
                ))}
                <div style={m.summaryTotal}>
                  <span>Est. total (ex. VAT)</span>
                  <span>£{saved.reduce((sum, r) => sum + parsePrice(r.price), 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Quote picker */}
              <div style={{ marginBottom: 16 }}>
                <label style={m.lbl}>Add to which quote?</label>

                {/* New quote option */}
                <label style={{ ...m.quoteOption, ...(selectedQuote === 'new' ? m.quoteOptionActive : {}) }}>
                  <input type="radio" name="quote" value="new" checked={selectedQuote === 'new'} onChange={() => setSelectedQuote('new')} style={{ marginRight: 10 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>✨ Create new quote</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>A fresh quote with these items as line items</div>
                  </div>
                </label>

                {/* Existing quotes */}
                {quotes.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                    {quotes.map(q => (
                      <label key={q.id} style={{ ...m.quoteOption, ...(selectedQuote === q.id ? m.quoteOptionActive : {}) }}>
                        <input type="radio" name="quote" value={q.id} checked={selectedQuote === q.id} onChange={() => setSelectedQuote(q.id)} style={{ marginRight: 10 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{q.quote_number}</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>{q.client?.name || 'No client'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Note about links */}
              <div style={m.note}>
                💡 Each item will be added as a line item. The description includes the supplier name and a direct link to the product page for reference.
              </div>
            </div>

            <div style={m.footer}>
              <button style={m.cancel} onClick={() => setAddModal(false)}>Cancel</button>
              <button style={{ ...m.confirm, opacity: adding ? 0.7 : 1 }} onClick={handleAddToQuote} disabled={adding}>
                {adding ? 'Adding…' : `Add ${saved.length} item${saved.length > 1 ? 's' : ''} to Quote`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,40px)', maxWidth: 960, margin: '0 auto' },
  hdr: { marginBottom: 24 },
  title: { fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' },
  sub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  successBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 12, padding: '14px 18px', marginBottom: 20, flexWrap: 'wrap' as const },
  successBtn: { background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: 'inherit' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: '8px 8px 8px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 14 },
  searchInp: { flex: 1, border: 'none', background: 'none', fontSize: 15, color: '#0F172A', padding: '8px 0', fontWeight: 500, fontFamily: 'inherit', minWidth: 0 },
  searchBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' },
  chips: { display: 'flex', flexWrap: 'wrap' as const, gap: 8 },
  chip: { padding: '5px 12px', borderRadius: 20, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, color: '#475569', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' as const, fontFamily: 'inherit' },
  errorBox: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600 },
  loadingWrap: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '60px 0' },
  spinner: { width: 36, height: 36, border: '3px solid #E2E8F0', borderTop: '3px solid #2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  analysisBanner: { background: 'linear-gradient(135deg,rgba(37,99,235,0.06),rgba(139,92,246,0.06))', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 14, padding: '18px 20px', marginBottom: 20 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14, marginBottom: 24 },
  card: { background: '#fff', border: '1px solid #F1F5F9', borderRadius: 14, padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' as const, gap: 0 },
  sourceTag: { fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: 6, flexShrink: 0 },
  visitBtn: { flex: 1, textAlign: 'center' as const, padding: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#475569', fontWeight: 600, textDecoration: 'none', display: 'block' },
  saveBtn: { padding: '8px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 13, color: '#2563EB', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: 'inherit' },
  savedBtn: { background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669' },
  savedPanel: { background: '#fff', border: '1px solid #F1F5F9', borderRadius: 16, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 24 },
  savedHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12, flexWrap: 'wrap' as const },
  savedTitle: { fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 2 },
  savedSub: { fontSize: 13, color: '#64748B' },
  addToQuoteBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' },
  savedRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, flexWrap: 'wrap' as const },
  removeBtn: { width: 26, height: 26, border: 'none', background: '#FEE2E2', color: '#EF4444', borderRadius: 6, cursor: 'pointer', fontSize: 11, flexShrink: 0, fontFamily: 'inherit' },
  savedTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '2px solid #F1F5F9' },
  emptyCenter: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const, padding: '60px 24px' },
  supplierChip: { padding: '6px 14px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 13, color: '#475569', fontWeight: 600 },
};

const m: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 },
  modal: { background: '#fff', borderRadius: 18, width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' },
  hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' },
  title: { fontSize: 17, fontWeight: 800, color: '#0F172A' },
  x: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8', fontFamily: 'inherit' },
  body: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  footer: { padding: '14px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, justifyContent: 'flex-end' },
  itemsSummary: { background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginBottom: 20 },
  itemsSummaryTitle: { fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#0F172A', padding: '4px 0', gap: 8 },
  summaryName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: '#475569' },
  summaryPrice: { fontWeight: 700, flexShrink: 0 },
  summaryTotal: { display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid #E2E8F0', marginTop: 10, paddingTop: 10, fontSize: 14, fontWeight: 700, color: '#0F172A' },
  lbl: { display: 'block', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 },
  quoteOption: { display: 'flex', alignItems: 'center', padding: '12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', marginBottom: 6, background: '#fff' },
  quoteOptionActive: { borderColor: '#2563EB', background: '#EFF6FF' },
  note: { fontSize: 12, color: '#64748B', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 12px', lineHeight: 1.5 },
  cancel: { background: '#fff', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  confirm: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
};
