import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [clientJobs, setClientJobs] = useState<any[]>([]);
  const [clientQuotes, setClientQuotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { if (user) fetchClients(); }, [user]);

  async function fetchClients() {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name');
    setClients(data || []);
    setLoading(false);
  }

  async function selectClient(c: any) {
    setSelected(c);
    const [{ data: jobs }, { data: quotes }] = await Promise.all([
      supabase.from('jobs').select('*').eq('client_id', c.id).order('created_at', { ascending: false }),
      supabase.from('quotes').select('*').eq('client_id', c.id).order('created_at', { ascending: false }),
    ]);
    setClientJobs(jobs || []);
    setClientQuotes(quotes || []);
  }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Clients</h1>
          <p style={s.sub}>{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={s.addBtn} onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add Client</button>
      </div>

      <div style={s.layout}>
        {/* Client list */}
        <div style={s.list}>
          <input style={s.search} placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} />
          {loading ? <div style={s.empty}>Loading…</div> :
            filtered.length === 0 ? <div style={s.empty}>No clients yet</div> :
            filtered.map(c => (
              <div key={c.id} style={{ ...s.clientRow, ...(selected?.id === c.id ? s.clientRowActive : {}) }} onClick={() => selectClient(c)}>
                <div style={s.avatar}>{c.name?.charAt(0).toUpperCase()}</div>
                <div style={s.clientInfo}>
                  <div style={s.clientName}>{c.name}</div>
                  <div style={s.clientEmail}>{c.email || c.phone || 'No contact info'}</div>
                </div>
                <button style={s.editRowBtn} onClick={e => { e.stopPropagation(); setEditing(c); setModalOpen(true); }}>✏️</button>
              </div>
            ))
          }
        </div>

        {/* Client detail */}
        <div style={s.detail}>
          {!selected ? (
            <div style={s.detailEmpty}>
              <span style={{ fontSize: 48 }}>👤</span>
              <p style={s.detailEmptyText}>Select a client to view their details</p>
            </div>
          ) : (
            <>
              <div style={s.detailHeader}>
                <div style={s.detailAvatar}>{selected.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <h2 style={s.detailName}>{selected.name}</h2>
                  {selected.company && <p style={s.detailCompany}>{selected.company}</p>}
                </div>
                <button style={s.editBtn} onClick={() => { setEditing(selected); setModalOpen(true); }}>Edit</button>
              </div>

              <div style={s.contactGrid}>
                {selected.email && <ContactChip icon="✉️" val={selected.email} />}
                {selected.phone && <ContactChip icon="📞" val={selected.phone} />}
                {selected.address && <ContactChip icon="📍" val={selected.address} />}
              </div>

              {/* Jobs */}
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Jobs ({clientJobs.length})</h3>
                {clientJobs.length === 0 ? <p style={s.none}>No jobs yet</p> : clientJobs.map(j => (
                  <div key={j.id} style={s.docRow}>
                    <span style={s.docTitle}>{j.title}</span>
                    <span style={{ ...s.pill, background: '#EFF6FF', color: '#2563EB' }}>{j.status}</span>
                    <span style={s.docDate}>{new Date(j.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                ))}
              </div>

              {/* Quotes & Invoices */}
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Quotes & Invoices ({clientQuotes.length})</h3>
                {clientQuotes.length === 0 ? <p style={s.none}>No documents yet</p> : clientQuotes.map(q => (
                  <div key={q.id} style={s.docRow}>
                    <span style={s.docNum}>{q.quote_number}</span>
                    <span style={s.docTitle}>{q.is_invoice ? 'Invoice' : 'Quote'}</span>
                    <span style={s.docAmount}>£{(q.total || 0).toFixed(2)}</span>
                    <span style={{ ...s.pill, background: q.status === 'paid' ? '#ECFDF5' : '#FFF7ED', color: q.status === 'paid' ? '#059669' : '#D97706' }}>
                      {q.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <ClientModal
          client={editing}
          userId={user.id}
          onClose={() => setModalOpen(false)}
          onSaved={async () => { setModalOpen(false); await fetchClients(); }}
        />
      )}
    </div>
  );
}

function ContactChip({ icon, val }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F8FAFC', borderRadius: 10, fontSize: 'var(--text-13)', color: '#475569', fontWeight: 500 }}>
      <span>{icon}</span><span>{val}</span>
    </div>
  );
}

function ClientModal({ client, userId, onClose, onSaved }: any) {
  const isEdit = !!client;
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (client) setForm({ name: client.name || '', email: client.email || '', phone: client.phone || '', address: client.address || '', notes: client.notes || '' });
  }, [client]);

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const payload = { ...form, user_id: userId, created_at: now, updated_at: now };
    const updatePayload = { ...form, user_id: userId, updated_at: now };
    if (isEdit) {
      const { error } = await supabase.from('clients').update(updatePayload).eq('id', client.id);
      if (error) console.error('Update error:', error);
    } else {
      const { error } = await supabase.from('clients').insert({ ...payload });
      if (error) console.error('Insert error:', error);
    }
    setSaving(false);
    onSaved();
  }

  async function del() {
    if (!confirm(`Delete ${client.name}? This won't delete their jobs or quotes.`)) return;
    setDeleting(true);
    await supabase.from('clients').delete().eq('id', client.id);
    setDeleting(false); onSaved();
  }

  return (
    <div style={m.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={m.modal}>
        <div style={m.hdr}>
          <h2 style={m.htitle}>{isEdit ? 'Edit Client' : 'New Client'}</h2>
          <button style={m.x} onClick={onClose}>✕</button>
        </div>
        <div style={m.body}>
          {[['name','Client name *','John Smith'],['email','Email','john@example.com'],['phone','Phone','+44 7700 900000'],['address','Address','123 High Street, London']].map(([k,lbl,ph]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <label style={m.lbl}>{lbl}</label>
              <input style={m.inp} value={(form as any)[k]} onChange={set(k)} placeholder={ph} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={m.lbl}>Notes</label>
            <textarea style={m.ta} value={form.notes} onChange={set('notes')} rows={3} placeholder="Any notes about this client…" />
          </div>
        </div>
        <div style={m.footer}>
          {isEdit && <button style={m.del} onClick={del} disabled={deleting}>{deleting ? '…' : 'Delete'}</button>}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button style={m.cancel} onClick={onClose}>Cancel</button>
            <button style={m.save} onClick={save} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add client'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,40px)', maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px' },
  sub: { fontSize: 'var(--text-13)', color: '#94A3B8', fontWeight: 500, marginTop: 4 },
  addBtn: { background: 'var(--accent-blue)', color: 'var(--bg-card)', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 'var(--text-13)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  layout: { display: 'grid', gridTemplateColumns: 'clamp(240px,30%,320px) 1fr', gap: 16, minHeight: 500 },
  list: { background: '#fff', borderRadius: 16, border: '1px solid #F1F5F9', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  search: { padding: '12px 16px', border: 'none', borderBottom: '1px solid #F1F5F9', fontSize: 'var(--text-13)', color: '#0F172A', fontFamily: 'inherit', outline: 'none', background: '#F8FAFC' },
  empty: { padding: 32, textAlign: 'center', color: '#94A3B8', fontWeight: 500, fontSize: 14 },
  clientRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F8FAFC', transition: 'background 0.1s' },
  clientRowActive: { background: '#EFF6FF' },
  avatar: { width: 36, height: 36, borderRadius: 10, background: 'var(--accent-blue)', color: 'var(--bg-card)', fontSize: 'var(--text-15)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  clientInfo: { flex: 1, overflow: 'hidden' },
  clientName: { fontSize: 'var(--text-13)', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  clientEmail: { fontSize: 'var(--text-11)', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 },
  editRowBtn: { background: 'none', border: 'none', fontSize: 'var(--text-13)', cursor: 'pointer', padding: 4, flexShrink: 0 },
  detail: { background: '#fff', borderRadius: 16, border: '1px solid #F1F5F9', padding: 28, overflow: 'auto' },
  detailEmpty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 },
  detailEmptyText: { fontSize: 'var(--text-15)', color: '#94A3B8', fontWeight: 500 },
  detailHeader: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
  detailAvatar: { width: 52, height: 52, borderRadius: 14, background: 'var(--accent-blue)', color: 'var(--bg-card)', fontSize: 'var(--text-20)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  detailName: { fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' },
  detailCompany: { fontSize: 'var(--text-13)', color: '#475569', fontWeight: 500, marginTop: 2 },
  editBtn: { marginLeft: 'auto', padding: '8px 16px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: '#fff', fontSize: 'var(--text-13)', fontWeight: 600, color: '#475569', cursor: 'pointer' },
  contactGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 'var(--text-13)', fontWeight: 800, color: '#0F172A', marginBottom: 12, letterSpacing: '-0.2px' },
  none: { fontSize: 'var(--text-13)', color: '#94A3B8', fontStyle: 'italic' },
  docRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, marginBottom: 6, flexWrap: 'wrap' },
  docNum: { fontSize: 'var(--text-11)', fontWeight: 700, color: '#2563EB' },
  docTitle: { fontSize: 'var(--text-13)', fontWeight: 600, color: '#0F172A', flex: 1 },
  docAmount: { fontSize: 'var(--text-13)', fontWeight: 700, color: '#0F172A' },
  docDate: { fontSize: 'var(--text-11)', color: '#94A3B8' },
  pill: { fontSize: 'var(--text-11)', fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
};

const m: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, padding: '24px 16px', overflowY: 'auto' },
  modal: { background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: 'calc(100vh - 48px)' },
  hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' },
  htitle: { fontSize: 17, fontWeight: 800, color: '#0F172A' },
  x: { background: 'none', border: 'none', fontSize: 'var(--text-17)', cursor: 'pointer', color: '#94A3B8' },
  body: { padding: '20px 24px', overflowY: 'auto', flex: 1, minHeight: 0 },
  footer: { padding: '14px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', flexShrink: 0, background: '#fff', borderRadius: '0 0 18px 18px' },
  lbl: { display: 'block', fontSize: 'var(--text-11)', fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  inp: { width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 'var(--text-13)', color: '#0F172A', background: '#F8FAFC', fontFamily: 'inherit', boxSizing: 'border-box' },
  ta: { width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 'var(--text-13)', color: '#0F172A', background: '#F8FAFC', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' },
  save: { background: 'var(--accent-blue)', color: 'var(--bg-card)', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 'var(--text-13)', fontWeight: 700, cursor: 'pointer' },
  cancel: { background: '#fff', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '11px 18px', fontSize: 'var(--text-13)', cursor: 'pointer' },
  del: { background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FEE2E2', borderRadius: 10, padding: '11px 18px', fontSize: 'var(--text-13)', cursor: 'pointer' },
};
