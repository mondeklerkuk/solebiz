import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function DocumentViewer({ quote, client, onClose }: any) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'preview'|'send'>('preview');
  const [emailTo, setEmailTo] = useState(client?.email || '');
  const [emailMsg, setEmailMsg] = useState('');
  const [sent, setSent] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const meta = user?.user_metadata || {};
  const biz = {
    name: meta.business_name || 'Your Business',
    email: meta.email || user?.email || '',
    phone: meta.phone || '',
    address: [meta.address, meta.city, meta.postcode].filter(Boolean).join(', '),
    website: meta.website || '',
    vat: meta.vat_number || '',
    logo: meta.logo || '',
    bank_name: meta.bank_name || '',
    account: meta.account_number || '',
    sort: meta.sort_code || '',
    terms: meta.payment_terms || 'Payment due within 30 days',
    notes: meta.invoice_notes || 'Thank you for your business.',
  };

  const isInv = quote.is_invoice;
  const docType = isInv ? 'Invoice' : 'Quote';
  const subtotal = quote.subtotal || 0;
  const hasVat = (quote.vat_rate || 0) > 0;
  const vatAmt = quote.vat_amount || 0;
  const total = quote.total || subtotal;

  useEffect(() => {
    supabase.from('quote_items').select('*').eq('quote_id', quote.id).order('sort_order')
      .then(({ data }) => { setItems(data || []); setLoading(false); });
    setEmailMsg(`Hi ${client?.name || 'there'},\n\nPlease find your ${docType.toLowerCase()} ${quote.quote_number} below.\n\nTotal: £${total.toFixed(2)}${isInv && quote.due_date ? `\nDue: ${new Date(quote.due_date).toLocaleDateString('en-GB')}` : ''}\n\nKind regards,\n${biz.name}${biz.phone ? '\n' + biz.phone : ''}`);
  }, []);

  function handlePrint() {
    const css = `
      @page { margin: 12mm; size: A4; }
      body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
      .no-print { display: none !important; }
    `;
    const w = window.open('', '_blank')!;
    w.document.write(`<html><head><style>${css}</style></head><body>${printRef.current?.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  }

  function handleWhatsApp() {
    const phone = client?.phone?.replace(/\D/g, '');
    const text = encodeURIComponent(`Hi ${client?.name || 'there'}, your ${docType.toLowerCase()} ${quote.quote_number} is ready — total £${total.toFixed(2)}. Thanks, ${biz.name}`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  function handleEmail() {
    const sub = encodeURIComponent(`${docType} ${quote.quote_number} from ${biz.name}`);
    const body = encodeURIComponent(emailMsg);
    window.open(`mailto:${emailTo}?subject=${sub}&body=${body}`, '_blank');
    supabase.from('quotes').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', quote.id);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  const STATUS_COLORS: Record<string, string> = {
    draft: '#94A3B8', sent: '#2563EB', accepted: '#10B981', paid: '#059669', declined: '#EF4444', invoiced: '#8B5CF6',
  };

  return (
    <div style={s.overlay}>
      <div style={s.shell}>
        {/* Top bar */}
        <div style={s.bar}>
          <button style={s.backBtn} onClick={onClose}>← Back</button>
          <span style={s.barTitle}>{docType} · {quote.quote_number}</span>
          <div style={s.barRight}>
            <button style={s.barBtn} onClick={handlePrint}>⬇ Download PDF</button>
            <button style={{ ...s.barBtn, ...s.barPrimary }} onClick={() => setTab('send')}>📤 Send</button>
          </div>
        </div>

        <div style={s.body}>
          {/* Tabs */}
          <div style={s.tabs}>
            <button style={{ ...s.tab, ...(tab === 'preview' ? s.tabActive : {}) }} onClick={() => setTab('preview')}>Preview</button>
            <button style={{ ...s.tab, ...(tab === 'send' ? s.tabActive : {}) }} onClick={() => setTab('send')}>Send & Share</button>
          </div>

          {tab === 'preview' ? (
            <div style={s.pageWrap}>
              {/* A4 Document */}
              <div ref={printRef} style={s.a4}>

                {/* Header */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}><tbody><tr>
                  <td style={{ verticalAlign: 'top' }}>
                    {biz.logo
                      ? <img src={biz.logo} style={{ height: 64, maxWidth: 200, objectFit: 'contain', marginBottom: 12, display: 'block' }} />
                      : <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{biz.name}</div>
                    }
                    {biz.logo && <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{biz.name}</div>}
                    {biz.address && <div style={s.bizLine}>{biz.address}</div>}
                    {biz.email && <div style={s.bizLine}>{biz.email}</div>}
                    {biz.phone && <div style={s.bizLine}>{biz.phone}</div>}
                    {biz.website && <div style={s.bizLine}>{biz.website}</div>}
                    {biz.vat && <div style={s.bizLine}>VAT: {biz.vat}</div>}
                  </td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-1px', marginBottom: 4 }}>{docType.toUpperCase()}</div>
                    <div style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>{quote.quote_number}</div>
                    <table style={{ borderCollapse: 'collapse', marginLeft: 'auto' }}><tbody>
                      {[
                        ['Date', new Date(quote.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
                        isInv && quote.due_date ? ['Due Date', new Date(quote.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })] : null,
                        !isInv && quote.expiry_date ? ['Valid Until', new Date(quote.expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })] : null,
                        ['Status', quote.status?.charAt(0).toUpperCase() + quote.status?.slice(1)],
                      ].filter(Boolean).map((row: any, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: 12, color: '#94A3B8', paddingRight: 16, paddingBottom: 4, textAlign: 'right', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row[0]}</td>
                          <td style={{ fontSize: 13, color: row[0] === 'Due Date' ? '#EF4444' : '#0F172A', fontWeight: 700, paddingBottom: 4, textAlign: 'right' }}>{row[1]}</td>
                        </tr>
                      ))}
                    </tbody></table>
                  </td>
                </tr></tbody></table>

                {/* Bill To */}
                <div style={s.billBox}>
                  <div style={s.billLabel}>BILL TO</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{client?.name || '—'}</div>
                  {client?.company && <div style={s.clientLine}>{client.company}</div>}
                  {client?.email && <div style={s.clientLine}>{client.email}</div>}
                  {client?.phone && <div style={s.clientLine}>{client.phone}</div>}
                  {client?.address && <div style={s.clientLine}>{client.address}</div>}
                </div>

                {/* Items table */}
                <table style={s.itemTable}>
                  <thead>
                    <tr style={{ background: '#0F172A' }}>
                      <th style={{ ...s.th, textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Description</th>
                      <th style={{ ...s.th, width: 60, textAlign: 'center' }}>Qty</th>
                      <th style={{ ...s.th, width: 110, textAlign: 'right' }}>Unit Price</th>
                      <th style={{ ...s.th, width: 110, textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>Loading…</td></tr>
                    ) : items.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: '20px', color: '#94A3B8' }}>No line items</td></tr>
                    ) : items.map((item, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#F8FAFC' : '#fff' }}>
                        <td style={s.td}>{item.description}</td>
                        <td style={{ ...s.td, textAlign: 'center', color: '#64748B' }}>{item.quantity}</td>
                        <td style={{ ...s.td, textAlign: 'right', color: '#64748B' }}>£{(item.unit_price || 0).toFixed(2)}</td>
                        <td style={{ ...s.td, textAlign: 'right', fontWeight: 700 }}>£{(item.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', marginTop: 8, marginBottom: 32 }}><tbody>
                  <tr>
                    <td style={s.totKey}>Subtotal</td>
                    <td style={s.totVal}>£{subtotal.toFixed(2)}</td>
                  </tr>
                  {hasVat && (
                    <tr>
                      <td style={s.totKey}>VAT ({quote.vat_rate}%)</td>
                      <td style={s.totVal}>£{vatAmt.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={2}><div style={{ height: 1, background: '#0F172A', margin: '8px 0' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ ...s.totKey, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Total{isInv ? ' Due' : ''}</td>
                    <td style={{ ...s.totVal, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>£{total.toFixed(2)}</td>
                  </tr>
                </tbody></table>

                {/* Bank details on invoices */}
                {isInv && (biz.bank_name || biz.account || biz.sort) && (
                  <div style={s.bankBox}>
                    <div style={s.bankTitle}>Payment Details</div>
                    <div style={s.bankGrid}>
                      {biz.bank_name && <><span style={s.bankKey}>Bank</span><span style={s.bankVal}>{biz.bank_name}</span></>}
                      {biz.account && <><span style={s.bankKey}>Account</span><span style={s.bankVal}>{biz.account}</span></>}
                      {biz.sort && <><span style={s.bankKey}>Sort code</span><span style={s.bankVal}>{biz.sort}</span></>}
                    </div>
                  </div>
                )}

                {/* Notes + Terms */}
                <div style={s.notesRow}>
                  {quote.notes && (
                    <div style={s.notesBox}>
                      <div style={s.notesLabel}>Notes</div>
                      <div style={s.notesText}>{quote.notes}</div>
                    </div>
                  )}
                  {biz.terms && (
                    <div style={s.notesBox}>
                      <div style={s.notesLabel}>Terms</div>
                      <div style={s.notesText}>{biz.terms}</div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={s.footer}>
                  <span>{biz.notes}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Send panel */
            <div style={s.sendPanel}>
              <h3 style={s.sendTitle}>Send {docType}</h3>

              {/* Share buttons */}
              <div style={s.shareGrid}>
                {[
                  { icon: '📧', label: 'Email', color: '#EFF6FF', action: handleEmail },
                  { icon: '💬', label: 'WhatsApp', color: '#F0FDF4', action: handleWhatsApp },
                  { icon: '📄', label: 'PDF / Print', color: '#F5F3FF', action: handlePrint },
                  { icon: '🔗', label: 'Copy link', color: '#FFFBEB', action: () => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); } },
                ].map(btn => (
                  <button key={btn.label} style={{ ...s.shareBtn, background: btn.color }} onClick={btn.action}>
                    <span style={{ fontSize: 28 }}>{btn.icon}</span>
                    <span style={s.shareBtnLabel}>{btn.label}</span>
                  </button>
                ))}
              </div>

              {/* Email composer */}
              <div style={s.emailCard}>
                <h4 style={s.emailCardTitle}>Email message</h4>
                <div style={{ marginBottom: 12 }}>
                  <label style={s.emailLbl}>To</label>
                  <input style={s.emailInp} type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="client@email.com" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={s.emailLbl}>Message</label>
                  <textarea style={s.emailTA} rows={8} value={emailMsg} onChange={e => setEmailMsg(e.target.value)} />
                </div>
                <button style={{ ...s.emailSend, background: sent ? '#10B981' : '#2563EB' }} onClick={handleEmail}>
                  {sent ? '✓ Email opened!' : '✉ Open in Email App'}
                </button>
                <p style={s.emailNote}>Opens your default email app with this message pre-filled.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: '#F8FAFC', zIndex: 200, display: 'flex', flexDirection: 'column' },
  shell: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  bar: { background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 },
  backBtn: { background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 600, color: '#64748B', cursor: 'pointer' },
  barTitle: { fontSize: 15, fontWeight: 800, color: '#0F172A', flex: 1 },
  barRight: { display: 'flex', gap: 10 },
  barBtn: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '9px 18px', fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer' },
  barPrimary: { background: '#2563EB', color: '#fff', border: 'none' },
  body: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' },
  tabs: { display: 'flex', gap: 4, padding: '16px 24px 0', borderBottom: '1px solid #E2E8F0', background: '#fff' },
  tab: { padding: '10px 20px', border: 'none', background: 'none', fontSize: 14, fontWeight: 600, color: '#64748B', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1 },
  tabActive: { color: '#2563EB', borderBottomColor: '#2563EB' },
  pageWrap: { padding: '32px 24px', display: 'flex', justifyContent: 'center' },
  // A4 document
  a4: { background: '#fff', width: '100%', maxWidth: 760, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', borderRadius: 8, padding: '48px 52px', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  bizLine: { fontSize: 13, color: '#64748B', lineHeight: 1.7 },
  billBox: { background: '#F8FAFC', borderRadius: 10, padding: '16px 20px', marginBottom: 28, borderLeft: '3px solid #2563EB', display: 'inline-block', minWidth: 220 },
  billLabel: { fontSize: 10, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 8 },
  clientLine: { fontSize: 13, color: '#64748B', lineHeight: 1.7 },
  itemTable: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 0', marginBottom: 0 },
  th: { padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' },
  td: { padding: '12px 14px', fontSize: 14, color: '#1E293B', borderBottom: '1px solid #F1F5F9' },
  totKey: { padding: '4px 0', paddingRight: 40, fontSize: 14, color: '#64748B', fontWeight: 500, textAlign: 'right' },
  totVal: { padding: '4px 0', fontSize: 14, fontWeight: 600, color: '#0F172A', textAlign: 'right', minWidth: 100 },
  bankBox: { background: '#EFF6FF', borderRadius: 10, padding: '16px 20px', marginBottom: 24 },
  bankTitle: { fontSize: 12, fontWeight: 800, color: '#2563EB', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' },
  bankGrid: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 24px' },
  bankKey: { fontSize: 13, color: '#64748B', fontWeight: 500 },
  bankVal: { fontSize: 13, color: '#0F172A', fontWeight: 700 },
  notesRow: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  notesBox: { flex: '1 1 200px', background: '#F8FAFC', borderRadius: 10, padding: '14px 16px' },
  notesLabel: { fontSize: 10, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 6 },
  notesText: { fontSize: 13, color: '#475569', lineHeight: 1.6 },
  footer: { textAlign: 'center', fontSize: 12, color: '#94A3B8', paddingTop: 20, borderTop: '1px solid #E2E8F0' },
  // Send panel
  sendPanel: { padding: '28px 32px', maxWidth: 640, margin: '0 auto', width: '100%' },
  sendTitle: { fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 24, letterSpacing: '-0.5px' },
  shareGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 32 },
  shareBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 10px', border: 'none', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.1s' },
  shareBtnLabel: { fontSize: 12, fontWeight: 700, color: '#475569' },
  emailCard: { background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  emailCardTitle: { fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 16 },
  emailLbl: { display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  emailInp: { width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', background: '#F8FAFC', fontFamily: 'inherit', boxSizing: 'border-box' },
  emailTA: { width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#475569', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, background: '#F8FAFC', boxSizing: 'border-box' },
  emailSend: { width: '100%', padding: '13px', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 },
  emailNote: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
};
