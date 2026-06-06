import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logo, setLogo] = useState('');
  const [form, setForm] = useState({
    business_name: '', email: '', phone: '', address: '',
    city: '', postcode: '', website: '', vat_number: '',
    bank_name: '', account_number: '', sort_code: '',
    payment_terms: 'Payment due within 30 days',
    invoice_notes: 'Thank you for your business.',
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const m = user.user_metadata || {};
    setForm({
      business_name: m.business_name || '',
      email: user.email || '',
      phone: m.phone || '',
      address: m.address || '',
      city: m.city || '',
      postcode: m.postcode || '',
      website: m.website || '',
      vat_number: m.vat_number || '',
      bank_name: m.bank_name || '',
      account_number: m.account_number || '',
      sort_code: m.sort_code || '',
      payment_terms: m.payment_terms || 'Payment due within 30 days',
      invoice_notes: m.invoice_notes || 'Thank you for your business.',
    });
    if (m.logo) setLogo(m.logo);
  }, [user]);

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  function handleLogo(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => setLogo(ev.target?.result as string);
    r.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    await supabase.auth.updateUser({ data: { ...form, logo } });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Settings</h1>
        <p style={s.sub}>Your business profile — used on all quotes & invoices</p>
      </div>

      <div style={s.grid}>
        <section style={s.card}>
          <h2 style={s.cardTitle}>Business Identity</h2>
          <div style={s.logoRow}>
            <div style={s.logoBig} onClick={() => fileRef.current?.click()}>
              {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />
                : <><span style={{ fontSize: 30 }}>🏢</span><span style={s.logoHint}>Click to upload</span></>}
            </div>
            <div>
              <p style={s.logoLabel}>Business Logo</p>
              <p style={s.logoSub}>PNG or JPG · shown on quotes & invoices</p>
              <button style={s.outBtn} onClick={() => fileRef.current?.click()}>Upload logo</button>
              {logo && <button style={s.dangerBtn} onClick={() => setLogo('')}>Remove</button>}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
            </div>
          </div>
          <F label="Business name *" v={form.business_name} on={set('business_name')} ph="Acme Plumbing Ltd" />
          <F label="Email" v={form.email} on={set('email')} ph="hello@yourbusiness.com" />
          <F label="Phone" v={form.phone} on={set('phone')} ph="+44 7700 900000" />
          <F label="Website" v={form.website} on={set('website')} ph="www.yourbusiness.com" />
        </section>

        <section style={s.card}>
          <h2 style={s.cardTitle}>Address & VAT</h2>
          <F label="Street address" v={form.address} on={set('address')} ph="123 High Street" />
          <F label="City" v={form.city} on={set('city')} ph="London" />
          <F label="Postcode" v={form.postcode} on={set('postcode')} ph="SW1A 1AA" />
          <div style={s.divider} />
          <F label="VAT number (optional)" v={form.vat_number} on={set('vat_number')} ph="GB123456789" />
        </section>

        <section style={s.card}>
          <h2 style={s.cardTitle}>Bank Details</h2>
          <p style={s.cardSub}>Displayed on invoices to help clients pay you</p>
          <F label="Bank name" v={form.bank_name} on={set('bank_name')} ph="Barclays" />
          <F label="Account number" v={form.account_number} on={set('account_number')} ph="12345678" />
          <F label="Sort code" v={form.sort_code} on={set('sort_code')} ph="12-34-56" />
        </section>

        <section style={s.card}>
          <h2 style={s.cardTitle}>Quote & Invoice Defaults</h2>
          <F label="Payment terms" v={form.payment_terms} on={set('payment_terms')} ph="Payment due within 30 days" />
          <div style={s.fw}>
            <label style={s.lbl}>Default footer notes</label>
            <textarea style={s.ta} value={form.invoice_notes} onChange={set('invoice_notes')} rows={3} placeholder="Thank you for your business." />
          </div>
        </section>
      </div>

      <div style={s.saveRow}>
        <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>
          {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}

function F({ label, v, on, ph }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={s.lbl}>{label}</label>
      <input style={s.inp} value={v} onChange={on} placeholder={ph} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(16px,4vw,36px) clamp(14px,4vw,40px)', maxWidth: 960, margin: '0 auto' },
  header: { marginBottom: 28 },
  title: { fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px' },
  sub: { fontSize: 14, color: '#94A3B8', fontWeight: 500, marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 20, letterSpacing: '-0.3px' },
  cardSub: { fontSize: 13, color: '#94A3B8', marginTop: -14, marginBottom: 18 },
  divider: { height: 1, background: '#F1F5F9', margin: '18px 0' },
  logoRow: { display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 },
  logoBig: { width: 88, height: 88, borderRadius: 14, border: '2px dashed #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0, overflow: 'hidden' },
  logoHint: { fontSize: 10, color: '#94A3B8', fontWeight: 600, textAlign: 'center' },
  logoLabel: { fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 },
  logoSub: { fontSize: 12, color: '#94A3B8', marginBottom: 10 },
  outBtn: { padding: '7px 14px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', marginRight: 8 },
  dangerBtn: { padding: '7px 14px', border: '1.5px solid #FEE2E2', borderRadius: 8, background: '#FEF2F2', fontSize: 13, fontWeight: 600, color: '#EF4444', cursor: 'pointer' },
  fw: { marginBottom: 14 },
  lbl: { display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  inp: { width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', background: '#F8FAFC', fontFamily: 'inherit', fontWeight: 500, boxSizing: 'border-box' },
  ta: { width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', background: '#F8FAFC', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' },
  saveRow: { display: 'flex', justifyContent: 'flex-end' },
  saveBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 36px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
