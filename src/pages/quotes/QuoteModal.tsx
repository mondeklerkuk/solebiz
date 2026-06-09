import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { QUOTE_STATUS_LABELS } from './QuotesPage';

const STATUSES = ['draft','sent','viewed','accepted','declined','invoiced','paid'];

function nextNum(isInv: boolean, existing: any[]) {
  const prefix = isInv ? 'INV' : 'Q';
  const year = new Date().getFullYear();
  const nums = existing
    .filter((q: any) => q.quote_number?.startsWith(`${prefix}-${year}`))
    .map((q: any) => parseInt(q.quote_number.split('-')[2] || '0'));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${year}-${String(next).padStart(3,'0')}`;
}

export default function QuoteModal({ quote, clients: initialClients, userId, onClose, onSaved, defaultInvoice }: any) {
  const isEdit = !!quote;
  const [isInvoice, setIsInvoice] = useState(quote?.is_invoice ?? defaultInvoice ?? false);
  const [status, setStatus]       = useState(quote?.status || 'draft');
  const [clientId, setClientId]   = useState(quote?.client_id || '');
  const [qNum, setQNum]           = useState(quote?.quote_number || '');
  const [issueDate, setIssueDate] = useState(quote?.issue_date || new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(quote?.expiry_date || '');
  const [dueDate, setDueDate]     = useState(quote?.due_date || '');
  const [notes, setNotes]         = useState(quote?.notes || '');
  const [vatEnabled, setVatEnabled] = useState(quote ? (quote.vat_rate || 0) > 0 : true);
  const [items, setItems]         = useState<any[]>([{ description: '', quantity: 1, unit_price: 0 }]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [allQuotes, setAllQuotes] = useState<any[]>([]);
  const [newClient, setNewClient] = useState('');
  const [addingClient, setAddingClient] = useState(false);
  // FIX: keep a local copy of clients so adding a new one refreshes the dropdown
  const [clients, setClients]     = useState<any[]>(initialClients || []);

  useEffect(() => {
    supabase.from('quotes').select('quote_number').eq('user_id', userId).then(({ data }) => {
      setAllQuotes(data || []);
      if (!isEdit) setQNum(nextNum(isInvoice, data || []));
    });
    if (isEdit && quote.id) loadItems();
  }, []);

  useEffect(() => { if (!isEdit) setQNum(nextNum(isInvoice, allQuotes)); }, [isInvoice]);

  // Keep clients in sync with parent if it updates
  useEffect(() => { setClients(initialClients || []); }, [initialClients]);

  async function loadItems() {
    const { data } = await supabase.from('quote_items').select('*').eq('quote_id', quote.id).order('sort_order');
    if (data?.length) setItems(data);
  }

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.quantity)||0) * (parseFloat(i.unit_price)||0), 0);
  const vatAmt   = vatEnabled ? subtotal * 0.2 : 0;
  const total    = subtotal + vatAmt;

  const upd = (i: number, k: string, v: any) =>
    setItems(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x));

  async function save() {
    if (!qNum) { setError('Quote number is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        user_id: userId, client_id: clientId || null, quote_number: qNum,
        status, is_invoice: isInvoice, issue_date: issueDate,
        expiry_date: expiryDate || null, due_date: dueDate || null,
        notes: notes || null, subtotal,
        vat_rate: vatEnabled ? 20 : 0,
        vat_amount: vatAmt, total,
        updated_at: new Date().toISOString(),
      };
      let qId = quote?.id;
      if (isEdit) {
        await supabase.from('quotes').update(payload).eq('id', qId);
      } else {
        const { data, error: e } = await supabase.from('quotes').insert(payload).select().single();
        if (e) throw e;
        qId = data?.id;
      }
      if (qId) {
        await supabase.from('quote_items').delete().eq('quote_id', qId);
        const lineItems = items
          .filter(i => i.description?.trim())
          .map((i, idx) => ({
            quote_id: qId,
            description: i.description,
            quantity: parseFloat(i.quantity) || 1,
            unit_price: parseFloat(i.unit_price) || 0,
            total: (parseFloat(i.quantity)||0) * (parseFloat(i.unit_price)||0),
            sort_order: idx,
          }));
        if (lineItems.length) await supabase.from('quote_items').insert(lineItems);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Save failed');
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm('Delete this document?')) return;
    await supabase.from('quote_items').delete().eq('quote_id', quote.id);
    await supabase.from('quotes').delete().eq('id', quote.id);
    onSaved();
  }

  // FIX: after adding client, insert into local clients list so dropdown refreshes immediately
  async function addClient() {
    const name = newClient.trim();
    if (!name) return;
    setAddingClient(true);
    try {
      const now = new Date().toISOString();
      const { data, error: e } = await supabase
        .from('clients')
        .insert({ name, user_id: userId, updated_at: now })
        .select()
        .single();
      if (e) throw e;
      if (data) {
        setClients(prev => [...prev, data]);   // refresh dropdown
        setClientId(data.id);                  // auto-select new client
      }
      setNewClient('');
    } catch (e: any) {
      setError('Could not add client: ' + e.message);
    } finally {
      setAddingClient(false);
    }
  }

  return (
    // FIX: use alignItems: 'flex-start' + paddingTop so modal sits near top and body can scroll
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        {/* Fixed header */}
        <div style={s.hdr}>
          <h2 style={s.htitle}>
            {isEdit ? (quote.is_invoice ? '🧾' : '📋') : '📄'}{' '}
            {isEdit ? (quote.is_invoice ? 'Invoice' : 'Quote') + ' ' + quote.quote_number : 'New Document'}
          </h2>
          <button style={s.x} onClick={onClose}>✕</button>
        </div>

        {/* Scrollable body — FIX: explicit overflow + min-height:0 so flex child can scroll */}
        <div style={s.body}>
          {error && <div style={s.err}>{error}</div>}

          {/* Type + Status */}
          <div style={s.row}>
            <div style={s.col}>
              <L>Document type</L>
              <div style={s.toggle}>
                <button style={{ ...s.tBtn, ...(!isInvoice ? s.tActive : {}) }}
                  onClick={() => !isEdit && setIsInvoice(false)}>📋 Quote</button>
                <button style={{ ...s.tBtn, ...(isInvoice ? s.tActive : {}) }}
                  onClick={() => !isEdit && setIsInvoice(true)}>🧾 Invoice</button>
              </div>
            </div>
            <div style={s.col}>
              <L>Status</L>
              <select style={s.inp} value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(st => <option key={st} value={st}>{QUOTE_STATUS_LABELS[st]}</option>)}
              </select>
            </div>
          </div>

          {/* Number + Client */}
          <div style={s.row}>
            <div style={s.col}>
              <L>Number</L>
              <input style={s.inp} value={qNum} onChange={e => setQNum(e.target.value)} />
            </div>
            <div style={s.col}>
              <L>Client</L>
              <select style={s.inp} value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">No client</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Quick-add client — FIX: button now triggers addClient() and dropdown refreshes */}
          <div style={s.quickAdd}>
            <input
              style={{ ...s.inp, flex: 1, marginBottom: 0 }}
              placeholder="Quick add client name…"
              value={newClient}
              onChange={e => setNewClient(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addClient()}
            />
            <button style={s.quickAddBtn} onClick={addClient} disabled={addingClient}>
              {addingClient ? '…' : '+ Add'}
            </button>
          </div>

          {/* Dates */}
          <div style={s.row}>
            <div style={s.col}>
              <L>Issue date</L>
              <input style={s.inp} type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div style={s.col}>
              <L>{isInvoice ? 'Due date' : 'Expiry date'}</L>
              <input style={s.inp} type="date"
                value={isInvoice ? dueDate : expiryDate}
                onChange={e => isInvoice ? setDueDate(e.target.value) : setExpiryDate(e.target.value)} />
            </div>
          </div>

          {/* Line items */}
          <L style={{ marginTop: 16 }}>Line Items</L>
          <div style={s.itemsHdr}>
            <span style={{ flex: 3 }}>Description</span>
            <span style={{ width: 55, textAlign: 'center' as const }}>Qty</span>
            <span style={{ width: 85, textAlign: 'right' as const }}>Unit £</span>
            <span style={{ width: 80, textAlign: 'right' as const }}>Total</span>
            <span style={{ width: 28 }} />
          </div>
          {items.map((item, i) => (
            <div key={i} style={s.itemRow}>
              <input style={{ ...s.inp, flex: 3, marginBottom: 0 }} placeholder="Description of work"
                value={item.description} onChange={e => upd(i,'description',e.target.value)} />
              <input style={{ ...s.inp, width: 55, textAlign: 'center' as const, marginBottom: 0 }}
                type="number" min="1" step="any" value={item.quantity}
                onChange={e => upd(i,'quantity',e.target.value)} />
              <input style={{ ...s.inp, width: 85, textAlign: 'right' as const, marginBottom: 0 }}
                type="number" min="0" step="0.01" value={item.unit_price}
                onChange={e => upd(i,'unit_price',e.target.value)} />
              <span style={{ width: 80, textAlign: 'right' as const, fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: '40px', flexShrink: 0 }}>
                £{((parseFloat(item.quantity)||0)*(parseFloat(item.unit_price)||0)).toFixed(2)}
              </span>
              <button style={s.rmBtn} onClick={() => setItems(p => p.filter((_,j) => j !== i))}>✕</button>
            </div>
          ))}
          <button style={s.addItem} onClick={() => setItems(p => [...p, { description:'',quantity:1,unit_price:0 }])}>
            + Add line item
          </button>

          {/* Totals */}
          <div style={s.totals}>
            <div style={s.totRow}><span>Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
            <div style={s.vatRow}>
              <label style={s.vatLabel}>
                <input type="checkbox" checked={vatEnabled} onChange={e => setVatEnabled(e.target.checked)}
                  style={{ marginRight: 8 }} />
                VAT (20%)
              </label>
              <span style={{ color: vatEnabled ? '#0F172A' : '#94A3B8' }}>£{vatAmt.toFixed(2)}</span>
            </div>
            <div style={s.grandRow}><span>Total</span><span>£{total.toFixed(2)}</span></div>
          </div>

          {/* Notes */}
          <L>Notes</L>
          <textarea style={s.ta} rows={3} placeholder="Payment terms, additional notes…"
            value={notes} onChange={e => setNotes(e.target.value)} />

          {/* Extra breathing room so last field isn't right against footer */}
          <div style={{ height: 8 }} />
        </div>

        {/* Fixed footer — always visible */}
        <div style={s.footer}>
          {isEdit && (
            <button style={s.delBtn} onClick={del}>🗑 Delete</button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={s.saveBtn} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : `Create ${isInvoice ? 'Invoice' : 'Quote'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function L({ children, style: st }: any) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8',
      marginBottom: 6, marginTop: 14, textTransform: 'uppercase' as const, letterSpacing: '0.06em', ...st }}>
      {children}
    </label>
  );
}

const s: Record<string, React.CSSProperties> = {
  // FIX: paddingTop: 24 pushes modal down slightly; alignItems flex-start ensures it doesn't
  // try to vertically centre a taller-than-viewport modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    zIndex: 200, padding: '24px 16px', overflowY: 'auto',
  },
  // FIX: no maxHeight — the overlay scrolls instead; modal is naturally as tall as it needs
  modal: {
    background: '#ffffff', borderRadius: 18, width: '100%', maxWidth: 660,
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
    // minHeight ensures footer is always reachable on desktop too
    maxHeight: 'calc(100vh - 48px)',
  },
  hdr: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 24px', borderBottom: '1px solid #F1F5F9', flexShrink: 0,
  },
  htitle: { fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 },
  x: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8', lineHeight: 1, padding: 4 },
  // FIX: minHeight: 0 is crucial — without it a flex child ignores overflow:auto
  body: { padding: '4px 24px 0', overflowY: 'auto', flex: 1, minHeight: 0 },
  footer: {
    padding: '14px 24px', borderTop: '1px solid #F1F5F9',
    display: 'flex', alignItems: 'center', flexShrink: 0,
    background: '#fff', borderRadius: '0 0 18px 18px',
  },
  err: { background: '#FEF2F2', color: '#DC2626', padding: '10px 12px', borderRadius: 10, marginBottom: 12, fontSize: 13, fontWeight: 600 },
  row: { display: 'flex', gap: 12, marginBottom: 0 },
  col: { flex: 1 },
  toggle: { display: 'flex', border: '1.5px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' },
  tBtn: { flex: 1, padding: '10px', border: 'none', background: '#F8FAFC', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: 'inherit', transition: 'all 0.15s' },
  tActive: { background: '#0F172A', color: '#fff' },
  inp: { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', background: '#F8FAFC', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 0 },
  ta: { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', background: '#F8FAFC', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 0 },
  quickAdd: { display: 'flex', gap: 8, marginTop: 8 },
  quickAddBtn: { padding: '10px 18px', background: '#EFF6FF', color: '#2563EB', border: '1.5px solid #BFDBFE', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 },
  itemsHdr: { display: 'flex', gap: 8, fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' },
  itemRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  rmBtn: { width: 32, height: 32, border: 'none', background: '#FEF2F2', color: '#EF4444', borderRadius: 8, cursor: 'pointer', fontSize: 13, flexShrink: 0, fontFamily: 'inherit' },
  addItem: { width: '100%', padding: '10px', border: '1.5px dashed #E2E8F0', borderRadius: 10, background: 'none', color: '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4, fontFamily: 'inherit' },
  totals: { background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginTop: 16, marginBottom: 4 },
  totRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 8 },
  vatRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 8 },
  vatLabel: { display: 'flex', alignItems: 'center', color: '#475569', fontWeight: 500, cursor: 'pointer' },
  grandRow: { display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: '#0F172A', borderTop: '2px solid #E2E8F0', paddingTop: 10, marginTop: 4 },
  saveBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtn: { background: '#fff', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  delBtn: { background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FEE2E2', borderRadius: 10, padding: '11px 18px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
};
