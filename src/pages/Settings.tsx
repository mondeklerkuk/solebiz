import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, refreshUser } = useAuth() as any;
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
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
  }, [user?.id]); // only re-run when user ID changes, not on every re-render

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  function handleLogo(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Compress if too large
    const r = new FileReader();
    r.onload = ev => {
      const result = ev.target?.result as string;
      // If > 500kb, compress via canvas
      if (result.length > 500000) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max = 300;
          let w = img.width, h = img.height;
          if (w > max) { h = (h * max) / w; w = max; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
          setLogo(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = result;
      } else {
        setLogo(result);
      }
    };
    r.readAsDataURL(file);
  }

  async function save() {
    setSaveStatus('saving');
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { ...form, logo }
      });
      if (error) throw error;
      // Pull fresh user data into context so dashboard/sidebar update instantly
      await refreshUser();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
    setSaving(false);
  }

  const btnLabel = { idle: 'Save settings', saving: 'Saving…', saved: '✓ Saved!', error: '✗ Error — try again' }[saveStatus];
  const btnColor = { idle: 'var(--accent-blue)', saving: 'var(--accent-blue)', saved: 'var(--accent-green)', error: 'var(--accent-red)' }[saveStatus];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Settings</h1>
          <p style={s.sub}>Your business profile — used on all quotes & invoices</p>
        </div>
        {saveStatus !== 'idle' && (
          <div style={{ ...s.statusBanner, background: btnColor }}>
            {btnLabel}
          </div>
        )}
      </div>

      <div style={s.grid}>
        <section style={s.card}>
          <h2 style={s.cardTitle}>Business Identity</h2>

          {/* Logo upload */}
          <div style={s.logoRow}>
            <div style={s.logoBig} onClick={() => fileRef.current?.click()}>
              {logo
                ? <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />
                : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>🏢</div>
                    <div style={s.logoHint}>Click to upload</div>
                  </div>
                )
              }
            </div>
            <div style={{ flex: 1 }}>
              <p style={s.logoLabel}>Business Logo</p>
              <p style={s.logoSub}>PNG or JPG · appears on quotes & invoices</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={s.outBtn} onClick={() => fileRef.current?.click()}>
                  {logo ? '🔄 Change logo' : '⬆ Upload logo'}
                </button>
                {logo && (
                  <button style={s.dangerBtn} onClick={() => setLogo('')}>Remove</button>
                )}
              </div>
              {logo && <p style={{ fontSize: 'var(--text-11)', color: 'var(--accent-green)', marginTop: 8, fontWeight: 600 }}>✓ Logo ready</p>}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />

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
          <p style={s.cardSub}>Shown on invoices so clients can pay you</p>
          <F label="Bank name" v={form.bank_name} on={set('bank_name')} ph="Barclays" />
          <F label="Account number" v={form.account_number} on={set('account_number')} ph="12345678" />
          <F label="Sort code" v={form.sort_code} on={set('sort_code')} ph="12-34-56" />
        </section>

        <section style={s.card}>
          <h2 style={s.cardTitle}>Invoice Defaults</h2>
          <F label="Payment terms" v={form.payment_terms} on={set('payment_terms')} ph="Payment due within 30 days" />
          <div style={{ marginBottom: 14 }}>
            <label style={s.lbl}>Default footer notes</label>
            <textarea style={s.ta} value={form.invoice_notes} onChange={set('invoice_notes')} rows={3} placeholder="Thank you for your business." />
          </div>
        </section>
      </div>

      <div style={s.saveRow}>
        <p style={s.saveHint}>Changes update the dashboard and all future documents instantly</p>
        <button
          style={{ ...s.saveBtn, background: btnColor, opacity: saving ? 0.8 : 1 }}
          onClick={save}
          disabled={saving}
        >
          {btnLabel}
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
  page: { padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,40px)', maxWidth: 960, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px' },
  sub: { fontSize: 'var(--text-13)', color: '#94A3B8', fontWeight: 500, marginTop: 4 },
  statusBanner: { color: 'var(--bg-card)', fontWeight: 700, fontSize: 'var(--text-13)', padding: '10px 20px', borderRadius: 10, transition: 'background 0.3s' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #F1F5F9', boxShadow: 'var(--shadow-card)' },
  cardTitle: { fontSize: 'var(--text-15)', fontWeight: 800, color: '#0F172A', marginBottom: 20, letterSpacing: '-0.3px' },
  cardSub: { fontSize: 'var(--text-13)', color: '#94A3B8', marginTop: -14, marginBottom: 18 },
  divider: { height: 1, background: '#F8FAFC', margin: '18px 0' },
  logoRow: { display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 },
  logoBig: { width: 96, height: 96, borderRadius: 14, border: '2px dashed #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  logoHint: { fontSize: 10, color: '#94A3B8', fontWeight: 600 },
  logoLabel: { fontSize: 'var(--text-13)', fontWeight: 700, color: '#0F172A', marginBottom: 4 },
  logoSub: { fontSize: 'var(--text-11)', color: '#94A3B8', marginBottom: 10 },
  outBtn: { padding: '8px 14px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: '#fff', fontSize: 'var(--text-13)', fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' },
  dangerBtn: { padding: '8px 14px', border: '1.5px solid #FEE2E2', borderRadius: 8, background: '#FEF2F2', fontSize: 'var(--text-13)', fontWeight: 600, color: 'var(--accent-red)', cursor: 'pointer', fontFamily: 'inherit' },
  lbl: { display: 'block', fontSize: 'var(--text-11)', fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  inp: { width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 'var(--text-13)', color: '#0F172A', background: '#F8FAFC', fontFamily: 'inherit', fontWeight: 500, boxSizing: 'border-box' },
  ta: { width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 'var(--text-13)', color: '#0F172A', background: '#F8FAFC', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' },
  saveRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  saveHint: { fontSize: 'var(--text-13)', color: '#94A3B8', fontStyle: 'italic' },
  saveBtn: { color: 'var(--bg-card)', border: 'none', borderRadius: 12, padding: '13px 36px', fontSize: 'var(--text-15)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.3s' },
};
