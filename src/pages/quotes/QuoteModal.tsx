import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { QUOTE_STATUS_LABELS } from './QuotesPage';

const STATUSES = ['draft','sent','viewed','accepted','declined','invoiced','paid'];

function nextNum(isInv: boolean, existing: any[]) {
  const prefix = isInv ? 'INV' : 'Q';
  const year = new Date().getFullYear();
  const nums = existing.filter((q: any) => q.quote_number?.startsWith(`${prefix}-${year}`))
    .map((q: any) => parseInt(q.quote_number.split('-')[2] || '0'));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${year}-${String(next).padStart(3,'0')}`;
}

export default function QuoteModal({ quote, clients, userId, onClose, onSaved }: any) {
  const isEdit = !!quote;
  const [isInvoice, setIsInvoice] = useState(quote?.is_invoice || false);
  const [status, setStatus] = useState(quote?.status || 'draft');
  const [clientId, setClientId] = useState(quote?.client_id || '');
  const [qNum, setQNum] = useState(quote?.quote_number || '');
  const [issueDate, setIssueDate] = useState(quote?.issue_date || new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(quote?.expiry_date || '');
  const [dueDate, setDueDate] = useState(quote?.due_date || '');
  const [notes, setNotes] = useState(quote?.notes || '');
  const [vatEnabled, setVatEnabled] = useState(quote ? (quote.vat_rate || 0) > 0 : true);
  const [vatRate] = useState(20);
  const [items, setItems] = useState<any[]>([{ description: '', quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [allQuotes, setAllQuotes] = useState<any[]>([]);
  const [newClient, setNewClient] = useState('');
  const [addingClient, setAddingClient] = useState(false);

  useEffect(() => {
    supabase.from('quotes').select('quote_number').eq('user_id', userId).then(({ data }) => {
      setAllQuotes(data || []);
      if (!isEdit) setQNum(nextNum(isInvoice, data || []));
    });
    if (isEdit && quote.id) loadItems();
  }, []);

  useEffect(() => { if (!isEdit) setQNum(nextNum(isInvoice, allQuotes)); }, [isInvoice]);

  async function loadItems() {
    const { data } = await supabase.from('quote_items').select('*').eq('quote_id', quote.id).order('sort_order');
    if (data?.length) setItems(data);
  }

  const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.quantity)||0) * (parseFloat(i.unit_price)||0), 0);
  const vatAmt = vatEnabled ? subtotal * (vatRate / 100) : 0;
  const total = subtotal + vatAmt;

  const upd = (i: number, k: string, v: any) => setItems(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x));

  async function save() {
    if (!qNum) { setError('Quote number required'); return; }
    setSaving(true); setError('');
    const payload = {
      user_id: userId, client_id: clientId || null, quote_number: qNum,
      status, is_invoice: isInvoice, issue_date: issueDate,
      expiry_date: expiryDate || null, due_date: dueDate || null,
      notes: notes || null, subtotal,
      vat_rate: vatEnabled ? vatRate : 0,
      vat_amount: vatAmt, total,
      updated_at: new Date().toISOString(),
    };
    let qId = quote?.id;
    if (isEdit) {
      await supabase.from('quotes').update(payload).eq('id', qId);
    } else {
      const { data } = await supabase.from('quotes').insert(payload).select().single();
      qId = data?.id;
    }
    if (qId) {
      await supabase.from('quote_items').delete().eq('quote_id', qId);
      const lineItems = items.filter(i => i.description?.trim()).map((i, idx) => ({
        quote_id: qId, description: i.description,
        quantity: parseFloat(i.quantity) || 1,
        unit_price: parseFloat(i.unit_price) || 0,
        total: (parseFloat(i.quantity)||0) * (parseFloat(i.unit_price)||0),
        sort_order: idx,
      }));
      if (lineItems.length) await supabase.from('quote_items').insert(lineItems);
    }
    setSaving(false); onSaved();
  }

  async function del() {
    if (!confirm('Delete this document?')) return;
    await supabase.from('quote_items').delete().eq('quote_id', quote.id);
    await supabase.from('quotes').delete().eq('id', quote.id);
    onSaved();
  }

  async function addClient() {
    if (!newClient.trim()) return;
    setAddingClient(true);
    const { data } = await supabase.from('clients').insert({ name: newClient.trim(), user_id: userId, created_at: new Date().toISOString() }).select().single();
    if (data) setClientId(data.id);
    setNewClient(''); setAddingClient(false);
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.hdr}>
          <h2 style={s.htitle}>{isEdit ? (quote.is_invoice ? '🧾 Invoice' : '📋 Quote') : 'New Document'} {isEdit ? quote.quote_number : ''}</h2>
          <button style={s.x} onClick={onClose}>✕</button>
        </div>

        <div style={s.body}>
          {error && <div style={s.err}>{error}</div>}

          {/* Type toggle */}
          <Row>
            <Col>
              <L>Document type</L>
              <div style={s.toggle}>
                <button style={{ ...s.tBtn, ...((!isInvoice) ? s.tActive : {}) }} onClick={() => !isEdit && setIsInvoice(false)}>📋 Quote</button>
                <button style={{ ...s.tBtn, ...(isInvoice ? s.tActive : {}) }} onClick={() => !isEdit && setIsInvoice(true)}>🧾 Invoice</button>
              </div>
            </Col>
            <Col>
              <L>Status</L>
              <select style={s.inp} value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(st => <option key={st} value={st}>{QUOTE_STATUS_LABELS[st]}</option>)}
              </select>
            </Col>
          </Row>

          <Row>
            <Col>
              <L>Number</L>
              <input style={s.inp} value={qNum} onChange={e => setQNum(e.target.value)} />
            </Col>
            <Col>
              <L>Client</L>
              <select style={s.inp} value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">No client</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Col>
          </Row>

          {/* Quick add client */}
          <div style={s.quickAdd}>
            <input style={{ ...s.inp, flex: 1 }} placeholder="Quick add client name…" value={newClient} onChange={e => setNewClient(e.target.value)} onKeyDown={e => e.key === 'Enter' && addClient()} />
            <button style={s.quickAddBtn} onClick={addClient} disabled={addingClient}>+ Add</button>
          </div>

          <Row>
            <Col>
              <L>Issue date</L>
              <input style={s.inp} type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </Col>
            <Col>
              <L>{isInvoice ? 'Due date' : 'Expiry date'}</L>
              <input style={s.inp} type="date" value={isInvoice ? dueDate : expiryDate}
                onChange={e => isInvoice ? setDueDate(e.target.value) : setExpiryDate(e.target.value)} />
            </Col>
          </Row>

          {/* Line items */}
          <L style={{ marginTop: 16 }}>Line Items</L>
          <div style={s.itemsHdr}>
            <span style={{ flex: 3 }}>Description</span>
            <span style={{ width: 60, textAlign: 'center' }}>Qty</span>
            <span style={{ width: 90, textAlign: 'right' }}>Unit £</span>
            <span style={{ width: 90, textAlign: 'right' }}>Total</span>
            <span style={{ width: 28 }} />
          </div>
          {items.map((item, i) => (
            <div key={i} style={s.itemRow}>
              <input style={{ ...s.inp, flex: 3 }} placeholder="Description of work" value={item.description} onChange={e => upd(i,'description',e.target.value)} />
              <input style={{ ...s.inp, width: 55, textAlign: 'center' }} type="number" min="1" step="any" value={item.quantity} onChange={e => upd(i,'quantity',e.target.value)} />
              <input style={{ ...s.inp, width: 85, textAlign: 'right' }} type="number" min="0" step="0.01" value={item.unit_price} onChange={e => upd(i,'unit_price',e.target.value)} />
              <span style={{ width: 90, textAlign: 'right', fontSize: 'var(--text-13)', fontWeight: 600, color: '#0F172A', lineHeight: '40px' }}>
                £{((parseFloat(item.quantity)||0)*(parseFloat(item.unit_price)||0)).toFixed(2)}
              </span>
              <button style={s.rmBtn} onClick={() => setItems(p => p.filter((_,j) => j !== i))}>✕</button>
            </div>
          ))}
          <button style={s.addItem} onClick={() => setItems(p => [...p, { description:'',quantity:1,unit_price:0 }])}>+ Add line item</button>

          {/* Totals + VAT toggle */}
          <div style={s.totals}>
            <div style={s.totRow}><span>Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
            <div style={s.vatRow}>
              <label style={s.vatLabel}>
                <input type="checkbox" checked={vatEnabled} onChange={e => setVatEnabled(e.target.checked)} style={{ marginRight: 8 }} />
                VAT (20%)
              </label>
              <span style={{ color: vatEnabled ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>£{vatAmt.toFixed(2)}</span>
            </div>
            <div style={s.grandRow}><span>Total</span><span>£{total.toFixed(2)}</span></div>
          </div>

          <L>Notes</L>
          <textarea style={s.ta} rows={3} placeholder="Payment terms, additional notes…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div style={s.footer}>
          {isEdit && <button style={s.delBtn} onClick={del}>Delete</button>}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={s.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ children }: any) { return <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>{children}</div>; }
function Col({ children }: any) { return <div style={{ flex: 1 }}>{children}</div>; }
function L({ children, style: st }: any) { return <label style={{ display: 'block', fontSize: 'var(--text-11)', fontWeight: 700, color: '#94A3B8', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.06em', ...st }}>{children}</label>; }

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modal: { background: '#ffffff', borderRadius: 18, width: '100%', maxWidth: 660, maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' },
  hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' },
  htitle: { fontSize: 17, fontWeight: 800, color: '#0F172A' },
  x: { background: 'none', border: 'none', fontSize: 'var(--text-17)', cursor: 'pointer', color: '#94A3B8' },
  body: { padding: '16px 24px', overflowY: 'auto', flex: 1 },
  footer: { padding: '14px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center' },
  err: { background: '#FEF2F2', color: '#DC2626', padding: '10px 12px', borderRadius: 10, marginBottom: 12, fontSize: 'var(--text-13)', fontWeight: 600 },
  toggle: { display: 'flex', border: '1.5px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' },
  tBtn: { flex: 1, padding: '10px', border: 'none', background: '#F8FAFC', cursor: 'pointer', fontSize: 'var(--text-13)', fontWeight: 600, color: '#475569', fontFamily: 'inherit' },
  tActive: { background: '#0F172A', color: '#fff' },
  inp: { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 'var(--text-13)', color: '#0F172A', background: '#F8FAFC', fontFamily: 'inherit', boxSizing: 'border-box' },
  ta: { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 'var(--text-13)', color: '#0F172A', background: '#F8FAFC', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' },
  quickAdd: { display: 'flex', gap: 8, marginTop: 8, marginBottom: 4 },
  quickAddBtn: { padding: '10px 16px', background: '#EFF6FF', color: '#2563EB', border: '1.5px solid #BFDBFE', borderRadius: 10, fontSize: 'var(--text-13)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  itemsHdr: { display: 'flex', gap: 8, fontSize: 'var(--text-11)', fontWeight: 700, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' },
  itemRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  rmBtn: { width: 28, height: 28, border: 'none', background: '#FEF2F2', color: '#EF4444', borderRadius: 6, cursor: 'pointer', fontSize: 'var(--text-11)', flexShrink: 0 },
  addItem: { width: '100%', padding: '9px', border: '1.5px dashed #E2E8F0', borderRadius: 10, background: 'none', color: '#94A3B8', fontSize: 'var(--text-13)', fontWeight: 600, cursor: 'pointer', marginTop: 4, fontFamily: 'inherit' },
  totals: { background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginTop: 16, marginBottom: 8 },
  totRow: { display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-13)', color: '#475569', marginBottom: 8 },
  vatRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-13)', marginBottom: 8 },
  vatLabel: { display: 'flex', alignItems: 'center', color: '#475569', fontWeight: 500, cursor: 'pointer' },
  grandRow: { display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: '#0F172A', borderTop: '2px solid #E2E8F0', paddingTop: 10, marginTop: 4 },
  saveBtn: { background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 'var(--text-13)', fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { background: '#fff', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 18px', fontSize: 'var(--text-13)', cursor: 'pointer' },
  delBtn: { background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FEE2E2', borderRadius: 10, padding: '11px 18px', fontSize: 'var(--text-13)', cursor: 'pointer' },
};
