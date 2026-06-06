import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { QUOTE_STATUS_LABELS } from './QuotesPage';

const STATUSES = ['draft','sent','viewed','accepted','declined','invoiced','paid'];
const VAT_RATE = 20;

function generateQuoteNumber(isInvoice: boolean, existing: any[]) {
  const prefix = isInvoice ? 'INV' : 'Q';
  const year = new Date().getFullYear();
  const nums = existing
    .filter((q: any) => q.quote_number?.startsWith(`${prefix}-${year}`))
    .map((q: any) => parseInt(q.quote_number.split('-')[2] || '0'));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${year}-${String(next).padStart(3, '0')}`;
}

export default function QuoteModal({ quote, clients, userId, onClose, onSaved }: any) {
  const isEdit = !!quote;
  const [isInvoice, setIsInvoice] = useState(quote?.is_invoice || false);
  const [status, setStatus] = useState(quote?.status || 'draft');
  const [clientId, setClientId] = useState(quote?.client_id || '');
  const [quoteNumber, setQuoteNumber] = useState(quote?.quote_number || '');
  const [issueDate, setIssueDate] = useState(quote?.issue_date || new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(quote?.expiry_date || '');
  const [dueDate, setDueDate] = useState(quote?.due_date || '');
  const [notes, setNotes] = useState(quote?.notes || '');
  const [items, setItems] = useState<any[]>([{ description: '', quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [allQuotes, setAllQuotes] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('quotes').select('quote_number').eq('user_id', userId).then(({ data }) => {
      setAllQuotes(data || []);
      if (!isEdit) setQuoteNumber(generateQuoteNumber(isInvoice, data || []));
    });
    if (isEdit && quote.id) loadItems();
  }, []);

  useEffect(() => {
    if (!isEdit) setQuoteNumber(generateQuoteNumber(isInvoice, allQuotes));
  }, [isInvoice]);

  async function loadItems() {
    const { data } = await supabase.from('quote_items').select('*').eq('quote_id', quote.id).order('sort_order');
    if (data && data.length > 0) setItems(data);
  }

  const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0);
  const vatAmount = subtotal * (VAT_RATE / 100);
  const total = subtotal + vatAmount;

  function updateItem(idx: number, field: string, val: any) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }

  async function handleSave() {
    if (!quoteNumber) { setError('Quote number is required'); return; }
    setSaving(true); setError('');
    const payload = {
      user_id: userId, client_id: clientId || null, quote_number: quoteNumber,
      status, is_invoice: isInvoice, issue_date: issueDate,
      expiry_date: expiryDate || null, due_date: dueDate || null,
      notes: notes || null, subtotal, vat_rate: VAT_RATE, vat_amount: vatAmount, total,
      updated_at: new Date().toISOString(),
    };
    let quoteId = quote?.id;
    if (isEdit) {
      await supabase.from('quotes').update(payload).eq('id', quoteId);
    } else {
      const { data } = await supabase.from('quotes').insert(payload).select().single();
      quoteId = data.id;
    }
    await supabase.from('quote_items').delete().eq('quote_id', quoteId);
    const lineItems = items.filter(i => i.description.trim()).map((i, idx) => ({
      quote_id: quoteId, description: i.description,
      quantity: parseFloat(i.quantity) || 1, unit_price: parseFloat(i.unit_price) || 0,
      total: (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), sort_order: idx,
    }));
    if (lineItems.length > 0) await supabase.from('quote_items').insert(lineItems);
    setSaving(false); onSaved();
  }

  async function handleDelete() {
    if (!confirm('Delete this document?')) return;
    await supabase.from('quote_items').delete().eq('quote_id', quote.id);
    await supabase.from('quotes').delete().eq('id', quote.id);
    onSaved();
  }

  async function convertToInvoice() {
    const invNumber = generateQuoteNumber(true, allQuotes);
    await supabase.from('quotes').update({ is_invoice: true, status: 'invoiced', quote_number: invNumber, invoice_date: new Date().toISOString().split('T')[0], updated_at: new Date().toISOString() }).eq('id', quote.id);
    onSaved();
  }

  async function markPaid() {
    await supabase.from('quotes').update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', quote.id);
    onSaved();
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h2 style={s.modalTitle}>{isEdit ? (quote.is_invoice ? '🧾 Invoice' : '📋 Quote') : 'New Quote'} {isEdit ? quote.quote_number : ''}</h2>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.body}>
          {error && <div style={s.error}>{error}</div>}
          {isEdit && (
            <div style={s.actions}>
              {!quote.is_invoice && quote.status === 'accepted' && <button style={s.actionBtn} onClick={convertToInvoice}>🧾 Convert to Invoice</button>}
              {quote.is_invoice && quote.status !== 'paid' && <button style={{ ...s.actionBtn, background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7' }} onClick={markPaid}>✅ Mark as Paid</button>}
            </div>
          )}
          <div style={s.row}>
            <div style={s.col}>
              <label style={s.label}>Type</label>
              <div style={s.toggle}>
                <button style={{ ...s.toggleBtn, ...(!isInvoice ? s.toggleActive : {}) }} onClick={() => !isEdit && setIsInvoice(false)}>Quote</button>
                <button style={{ ...s.toggleBtn, ...(isInvoice ? s.toggleActive : {}) }} onClick={() => !isEdit && setIsInvoice(true)}>Invoice</button>
              </div>
            </div>
            <div style={s.col}>
              <label style={s.label}>Status</label>
              <select style={s.input} value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(st => <option key={st} value={st}>{QUOTE_STATUS_LABELS[st]}</option>)}
              </select>
            </div>
          </div>
          <div style={s.row}>
            <div style={s.col}><label style={s.label}>Number</label><input style={s.input} value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)} /></div>
            <div style={s.col}>
              <label style={s.label}>Client</label>
              <select style={s.input} value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">No client</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={s.row}>
            <div style={s.col}><label style={s.label}>Issue date</label><input style={s.input} type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
            <div style={s.col}>
              <label style={s.label}>{isInvoice ? 'Due date' : 'Expiry date'}</label>
              <input style={s.input} type="date" value={isInvoice ? dueDate : expiryDate} onChange={e => isInvoice ? setDueDate(e.target.value) : setExpiryDate(e.target.value)} />
            </div>
          </div>
          <label style={{ ...s.label, marginTop: 16 }}>Line Items</label>
          <div style={s.itemsHeader}><span style={{ flex: 3 }}>Description</span><span style={{ width: 70, textAlign: 'center' }}>Qty</span><span style={{ width: 90, textAlign: 'right' }}>Unit price</span><span style={{ width: 90, textAlign: 'right' }}>Total</span><span style={{ width: 28 }}></span></div>
          {items.map((item, idx) => (
            <div key={idx} style={s.itemRow}>
              <input style={{ ...s.input, flex: 3 }} placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
              <input style={{ ...s.input, width: 60, textAlign: 'center' }} type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
              <input style={{ ...s.input, width: 80, textAlign: 'right' }} type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} />
              <span style={{ width: 90, textAlign: 'right', fontSize: 14, color: '#3C3C43', lineHeight: '38px' }}>£{((parseFloat(item.quantity)||0)*(parseFloat(item.unit_price)||0)).toFixed(2)}</span>
              <button style={s.removeBtn} onClick={() => setItems(prev => prev.filter((_,i) => i !== idx))}>✕</button>
            </div>
          ))}
          <button style={s.addItemBtn} onClick={() => setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])}>+ Add line item</button>
          <div style={s.totals}>
            <div style={s.totalRow}><span>Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
            <div style={s.totalRow}><span>VAT ({VAT_RATE}%)</span><span>£{vatAmount.toFixed(2)}</span></div>
            <div style={{ ...s.totalRow, fontWeight: 700, fontSize: 16, borderTop: '2px solid #E5E7EB', paddingTop: 10, marginTop: 4 }}><span>Total</span><span>£{total.toFixed(2)}</span></div>
          </div>
          <label style={s.label}>Notes</label>
          <textarea style={s.textarea} placeholder="Payment terms, notes for client..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div style={s.footer}>
          {isEdit && <button style={s.deleteBtn} onClick={handleDelete}>Delete</button>}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modal: { background: '#fff', borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #F3F4F6' },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#1C1C1E', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#8E8E93' },
  body: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  footer: { padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center' },
  error: { background: '#FEF2F2', color: '#DC2626', padding: '10px 12px', borderRadius: 10, marginBottom: 14, fontSize: 13 },
  actions: { display: 'flex', gap: 8, marginBottom: 16 },
  actionBtn: { padding: '8px 14px', borderRadius: 10, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  row: { display: 'flex', gap: 12, marginBottom: 4 },
  col: { flex: 1 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#3C3C43', marginBottom: 5, marginTop: 12 },
  input: { width: '100%', padding: '9px 11px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#1C1C1E', background: '#F2F2F7', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '9px 11px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#1C1C1E', background: '#F2F2F7', boxSizing: 'border-box', minHeight: 70, resize: 'vertical' },
  toggle: { display: 'flex', border: '1px solid #D1D5DB', borderRadius: 10, overflow: 'hidden' },
  toggleBtn: { flex: 1, padding: '9px', border: 'none', background: '#F2F2F7', cursor: 'pointer', fontSize: 13, color: '#8E8E93' },
  toggleActive: { background: '#007AFF', color: '#fff', fontWeight: 600 },
  itemsHeader: { display: 'flex', gap: 8, padding: '6px 0', fontSize: 11, fontWeight: 600, color: '#8E8E93', marginBottom: 4 },
  itemRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  removeBtn: { width: 28, height: 28, border: 'none', background: '#FEF2F2', color: '#DC2626', borderRadius: 6, cursor: 'pointer', fontSize: 11, flexShrink: 0 },
  addItemBtn: { background: 'none', border: '1px dashed #D1D5DB', borderRadius: 10, padding: '8px', width: '100%', color: '#8E8E93', fontSize: 13, cursor: 'pointer', marginTop: 4 },
  totals: { background: '#F2F2F7', borderRadius: 12, padding: '14px 16px', marginTop: 16, marginBottom: 8 },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#3C3C43', marginBottom: 6 },
  saveBtn: { background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { background: '#fff', color: '#3C3C43', border: '1px solid #D1D5DB', borderRadius: 10, padding: '10px 16px', fontSize: 14, cursor: 'pointer' },
  deleteBtn: { background: '#fff', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 16px', fontSize: 14, cursor: 'pointer' },
};
