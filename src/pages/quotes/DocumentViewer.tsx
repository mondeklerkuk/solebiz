import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface Props {
  quote: any;
  client: any;
  userProfile: any;
  onClose: () => void;
}

export default function DocumentViewer({ quote, client, userProfile, onClose }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [emailAddr, setEmailAddr] = useState(client?.email || '');
  const [emailMsg, setEmailMsg] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sent, setSent] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const isInvoice = quote.is_invoice;
  const docType = isInvoice ? 'Invoice' : 'Quote';
  const businessName = userProfile?.business_name || 'Your Business';
  const businessEmail = userProfile?.email || '';
  const businessPhone = userProfile?.phone || '';
  const businessAddress = userProfile?.address || '';

  useEffect(() => {
    supabase.from('quote_items').select('*').eq('quote_id', quote.id).order('sort_order')
      .then(({ data }) => { setItems(data || []); setLoading(false); });

    setEmailMsg(`Hi ${client?.name || 'there'},\n\nPlease find your ${docType.toLowerCase()} ${quote.quote_number} attached.\n\nTotal: £${(quote.total || 0).toFixed(2)}\n${isInvoice ? `Due date: ${quote.due_date ? new Date(quote.due_date).toLocaleDateString('en-GB') : 'On receipt'}` : `Valid until: ${quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString('en-GB') : '30 days'}`}\n\nPlease don't hesitate to get in touch if you have any questions.\n\nKind regards,\n${businessName}`);
  }, []);

  function handlePrint() {
    const style = document.createElement('style');
    style.innerHTML = `@media print { body > *:not(#print-root) { display: none !important; } #print-root { display: block !important; } @page { margin: 0; size: A4; } }`;
    document.head.appendChild(style);
    const printRoot = document.createElement('div');
    printRoot.id = 'print-root';
    printRoot.innerHTML = printRef.current?.innerHTML || '';
    document.body.appendChild(printRoot);
    window.print();
    document.body.removeChild(printRoot);
    document.head.removeChild(style);
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(
      `Hi ${client?.name || 'there'}, your ${docType.toLowerCase()} ${quote.quote_number} is ready.\n\nTotal: £${(quote.total || 0).toFixed(2)}\n\nPlease visit the link below to view it or reply to confirm. Thanks, ${businessName}`
    );
    const phone = client?.phone?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  function handleSMS() {
    const text = encodeURIComponent(`Hi ${client?.name || ''}, your ${docType.toLowerCase()} ${quote.quote_number} is ready. Total: £${(quote.total || 0).toFixed(2)}. Reply to confirm. Thanks, ${businessName}`);
    window.open(`sms:${client?.phone || ''}?body=${text}`, '_blank');
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/view/${quote.id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  }

  async function handleSendEmail() {
    if (!emailAddr) return;
    setSendingEmail(true);
    // Use Claude API to format the email
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [{ role: 'user', content: `Confirm you received this email sending request: To: ${emailAddr}, Subject: ${docType} ${quote.quote_number} from ${businessName}, Body: ${emailMsg}. Reply with just "confirmed".` }]
      })
    });
    // In production, wire to your email service (Resend, SendGrid etc.)
    // For now, open the device mail client
    const subject = encodeURIComponent(`${docType} ${quote.quote_number} from ${businessName}`);
    const body = encodeURIComponent(emailMsg);
    window.open(`mailto:${emailAddr}?subject=${subject}&body=${body}`, '_blank');
    await supabase.from('quotes').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', quote.id);
    setSendingEmail(false);
    setSent(true);
    setTimeout(() => { setSent(false); setShareOpen(false); }, 2000);
  }

  const subtotal = quote.subtotal || items.reduce((s: number, i: any) => s + (i.total || 0), 0);
  const vatAmount = quote.vat_amount || subtotal * 0.2;
  const total = quote.total || subtotal + vatAmount;

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        {/* Toolbar */}
        <div style={s.toolbar}>
          <div style={s.toolbarLeft}>
            <button style={s.closeBtn} onClick={onClose}>← Back</button>
            <span style={s.docLabel}>{docType} {quote.quote_number}</span>
          </div>
          <div style={s.toolbarRight}>
            <button style={s.toolBtn} onClick={handlePrint}>⬇ Download PDF</button>
            <button style={{ ...s.toolBtn, ...s.primaryToolBtn }} onClick={() => setShareOpen(true)}>
              📤 Send
            </button>
          </div>
        </div>

        <div style={s.body}>
          {/* Document preview */}
          <div ref={printRef} style={s.document}>
            {/* Header */}
            <div style={s.docHeader}>
              <div style={s.bizBlock}>
                <div style={s.bizLogo}>{businessName.charAt(0)}</div>
                <div>
                  <div style={s.bizName}>{businessName}</div>
                  {businessEmail && <div style={s.bizDetail}>{businessEmail}</div>}
                  {businessPhone && <div style={s.bizDetail}>{businessPhone}</div>}
                  {businessAddress && <div style={s.bizDetail}>{businessAddress}</div>}
                </div>
              </div>
              <div style={s.docMeta}>
                <div style={s.docTypeLabel}>{docType.toUpperCase()}</div>
                <div style={s.docNumber}>{quote.quote_number}</div>
                <table style={s.metaTable}>
                  <tbody>
                    <tr><td style={s.metaKey}>Issue date</td><td style={s.metaVal}>{new Date(quote.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                    {isInvoice && quote.due_date && <tr><td style={s.metaKey}>Due date</td><td style={{ ...s.metaVal, color: '#EF4444', fontWeight: 700 }}>{new Date(quote.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>}
                    {!isInvoice && quote.expiry_date && <tr><td style={s.metaKey}>Valid until</td><td style={s.metaVal}>{new Date(quote.expiry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>}
                    <tr><td style={s.metaKey}>Status</td><td style={s.metaVal}><span style={{ ...s.statusPill, background: quote.status === 'paid' ? '#ECFDF5' : '#FFF7ED', color: quote.status === 'paid' ? '#059669' : '#D97706' }}>{quote.status?.charAt(0).toUpperCase() + quote.status?.slice(1)}</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={s.divLine} />

            {/* Bill to */}
            {client && (
              <div style={s.billTo}>
                <div style={s.billToLabel}>BILL TO</div>
                <div style={s.clientName}>{client.name}</div>
                {client.email && <div style={s.clientDetail}>{client.email}</div>}
                {client.phone && <div style={s.clientDetail}>{client.phone}</div>}
                {client.address && <div style={s.clientDetail}>{client.address}</div>}
              </div>
            )}

            {/* Line items */}
            <div style={s.itemsTable}>
              <div style={s.itemsHeader}>
                <span style={{ flex: 3 }}>Description</span>
                <span style={{ width: 60, textAlign: 'center' }}>Qty</span>
                <span style={{ width: 100, textAlign: 'right' }}>Unit Price</span>
                <span style={{ width: 100, textAlign: 'right' }}>Total</span>
              </div>
              {loading ? (
                <div style={{ padding: '20px', color: '#94A3B8', textAlign: 'center' }}>Loading items…</div>
              ) : items.length > 0 ? items.map((item: any, i: number) => (
                <div key={i} style={{ ...s.itemRow, ...(i % 2 === 0 ? {} : { background: '#F8FAFC' }) }}>
                  <span style={{ flex: 3, fontSize: 14, color: '#1E293B' }}>{item.description}</span>
                  <span style={{ width: 60, textAlign: 'center', fontSize: 14, color: '#64748B' }}>{item.quantity}</span>
                  <span style={{ width: 100, textAlign: 'right', fontSize: 14, color: '#64748B' }}>£{(item.unit_price || 0).toFixed(2)}</span>
                  <span style={{ width: 100, textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#0F172A' }}>£{(item.total || 0).toFixed(2)}</span>
                </div>
              )) : (
                <div style={{ padding: '20px', color: '#94A3B8', fontSize: 14 }}>No line items</div>
              )}
            </div>

            {/* Totals */}
            <div style={s.totalsSection}>
              <div style={s.totalRow}><span style={s.totalKey}>Subtotal</span><span style={s.totalVal}>£{subtotal.toFixed(2)}</span></div>
              <div style={s.totalRow}><span style={s.totalKey}>VAT (20%)</span><span style={s.totalVal}>£{vatAmount.toFixed(2)}</span></div>
              <div style={s.grandTotalRow}>
                <span style={s.grandKey}>Total{isInvoice ? ' Due' : ''}</span>
                <span style={s.grandVal}>£{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <div style={s.notesSection}>
                <div style={s.notesLabel}>Notes</div>
                <div style={s.notesText}>{quote.notes}</div>
              </div>
            )}

            {/* Footer */}
            <div style={s.docFooter}>
              <span>Thank you for your business</span>
              <span style={{ color: '#CBD5E1' }}>·</span>
              <span>{businessName}</span>
              {businessEmail && <><span style={{ color: '#CBD5E1' }}>·</span><span>{businessEmail}</span></>}
            </div>
          </div>

          {/* Share panel */}
          {shareOpen && (
            <div style={s.sharePanel}>
              <div style={s.sharePanelHeader}>
                <h3 style={s.sharePanelTitle}>Send {docType}</h3>
                <button style={s.sharePanelClose} onClick={() => setShareOpen(false)}>✕</button>
              </div>

              {/* Quick share buttons */}
              <div style={s.quickShare}>
                <button style={s.shareMethod} onClick={handleWhatsApp}>
                  <div style={{ ...s.shareIcon, background: '#25D36615' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.86L0 24l6.29-1.499A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.897 0-3.667-.516-5.188-1.415l-.372-.222-3.735.891.934-3.611-.243-.384A9.937 9.937 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  </div>
                  <span style={s.shareLabel}>WhatsApp</span>
                </button>

                <button style={s.shareMethod} onClick={handleSMS}>
                  <div style={{ ...s.shareIcon, background: '#3B82F615' }}>
                    <span style={{ fontSize: 22 }}>💬</span>
                  </div>
                  <span style={s.shareLabel}>SMS</span>
                </button>

                <button style={s.shareMethod} onClick={handlePrint}>
                  <div style={{ ...s.shareIcon, background: '#8B5CF615' }}>
                    <span style={{ fontSize: 22 }}>📄</span>
                  </div>
                  <span style={s.shareLabel}>PDF</span>
                </button>

                <button style={s.shareMethod} onClick={handleCopyLink}>
                  <div style={{ ...s.shareIcon, background: '#F59E0B15' }}>
                    <span style={{ fontSize: 22 }}>🔗</span>
                  </div>
                  <span style={s.shareLabel}>Copy link</span>
                </button>
              </div>

              {/* Email composer */}
              <div style={s.emailSection}>
                <label style={s.emailLabel}>Send via Email</label>
                <input
                  style={s.emailInput}
                  type="email"
                  placeholder="client@email.com"
                  value={emailAddr}
                  onChange={e => setEmailAddr(e.target.value)}
                />
                <textarea
                  style={s.emailBody}
                  value={emailMsg}
                  onChange={e => setEmailMsg(e.target.value)}
                  rows={7}
                />
                <button
                  style={{ ...s.sendEmailBtn, opacity: sendingEmail ? 0.7 : 1 }}
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                >
                  {sent ? '✓ Sent!' : sendingEmail ? 'Opening…' : '✉ Send Email'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'stretch' },
  modal: { background: '#F8FAFC', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  toolbar: { background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  toolbarRight: { display: 'flex', gap: 10 },
  closeBtn: { background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 600, color: '#64748B', cursor: 'pointer' },
  docLabel: { fontSize: 15, fontWeight: 700, color: '#0F172A' },
  toolBtn: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer' },
  primaryToolBtn: { background: '#2563EB', color: '#fff', border: 'none' },
  body: { flex: 1, display: 'flex', overflow: 'hidden' },
  // Document styles
  document: { flex: 1, overflowY: 'auto', padding: 'clamp(16px,4vw,48px)', display: 'flex', justifyContent: 'center' },
  // Inner document (actual A4-like)
  docHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 24, width: '100%', maxWidth: 720, margin: '0 auto 32px' },
  bizBlock: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  bizLogo: { width: 48, height: 48, borderRadius: 12, background: '#2563EB', color: '#fff', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bizName: { fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 },
  bizDetail: { fontSize: 13, color: '#64748B', lineHeight: 1.6 },
  docMeta: { textAlign: 'right' },
  docTypeLabel: { fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 4 },
  docNumber: { fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 12 },
  metaTable: { borderCollapse: 'collapse' as const, marginLeft: 'auto' },
  metaKey: { fontSize: 12, color: '#94A3B8', fontWeight: 600, paddingRight: 16, paddingBottom: 4, textAlign: 'right' as const },
  metaVal: { fontSize: 13, color: '#0F172A', fontWeight: 600, textAlign: 'right' as const, paddingBottom: 4 },
  statusPill: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block' },
  divLine: { height: 1, background: '#E2E8F0', maxWidth: 720, margin: '0 auto 28px', width: '100%' },
  billTo: { maxWidth: 720, margin: '0 auto 28px', width: '100%' },
  billToLabel: { fontSize: 10, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 8 },
  clientName: { fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 4 },
  clientDetail: { fontSize: 13, color: '#64748B', lineHeight: 1.6 },
  itemsTable: { maxWidth: 720, margin: '0 auto 24px', width: '100%', background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0' },
  itemsHeader: { display: 'flex', padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.06em' },
  itemRow: { display: 'flex', padding: '14px 20px', borderBottom: '1px solid #F1F5F9', alignItems: 'center' },
  totalsSection: { maxWidth: 720, margin: '0 auto 24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  totalRow: { display: 'flex', gap: 60, fontSize: 14 },
  totalKey: { color: '#64748B', fontWeight: 500, minWidth: 80, textAlign: 'right' as const },
  totalVal: { color: '#0F172A', fontWeight: 600, minWidth: 80, textAlign: 'right' as const },
  grandTotalRow: { display: 'flex', gap: 60, fontSize: 18, fontWeight: 800, borderTop: '2px solid #0F172A', paddingTop: 10, marginTop: 4 },
  grandKey: { color: '#0F172A', minWidth: 80, textAlign: 'right' as const },
  grandVal: { color: '#0F172A', minWidth: 80, textAlign: 'right' as const },
  notesSection: { maxWidth: 720, margin: '0 auto 24px', width: '100%', background: '#F8FAFC', borderRadius: 10, padding: '16px 20px' },
  notesLabel: { fontSize: 10, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 8 },
  notesText: { fontSize: 14, color: '#475569', lineHeight: 1.6 },
  docFooter: { maxWidth: 720, margin: '40px auto 0', width: '100%', display: 'flex', gap: 12, fontSize: 12, color: '#94A3B8', paddingTop: 20, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' },
  // Share panel
  sharePanel: { width: 340, background: '#fff', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 },
  sharePanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0' },
  sharePanelTitle: { fontSize: 16, fontWeight: 800, color: '#0F172A' },
  sharePanelClose: { background: 'none', border: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer', padding: 4 },
  quickShare: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, padding: '20px 20px 0' },
  shareMethod: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 4px', borderRadius: 10 },
  shareIcon: { width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  shareLabel: { fontSize: 11, fontWeight: 600, color: '#64748B' },
  emailSection: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 },
  emailLabel: { fontSize: 13, fontWeight: 700, color: '#0F172A' },
  emailInput: { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', fontFamily: 'inherit' },
  emailBody: { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#475569', fontFamily: 'inherit', resize: 'vertical' as const, lineHeight: 1.6, flex: 1 },
  sendEmailBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
};
