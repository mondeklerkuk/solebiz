import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { STATUS_LABELS } from './JobsPage';

interface Props {
  job: Job | null;
  clients: Client[];
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

const STATUSES: JobStatus[] = ['enquiry', 'quoted', 'confirmed', 'in_progress', 'completed', 'archived'];

export default function JobModal({ job, clients, userId, onClose, onSaved }: Props) {
  const isEdit = !!job;
  const [title, setTitle] = useState(job?.title || '');
  const [description, setDescription] = useState(job?.description || '');
  const [status, setStatus] = useState<JobStatus>(job?.status || 'enquiry');
  const [clientId, setClientId] = useState('');
  const [scheduledAt, setScheduledAt] = useState(job?.scheduled_at ? job.scheduled_at.slice(0, 16) : '');
  const [notes, setNotes] = useState(job?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  async function createClientAndSave() {
    if (!newClientName.trim()) { setError('Client name is required'); return; }
    const { data, error: e } = await supabase.from('clients').insert({
      user_id: userId, name: newClientName.trim(), email: newClientEmail || null, phone: newClientPhone || null,
    }).select().single();
    if (e) { setError(e.message); return; }
    return data.id;
  }

  async function handleSave() {
    if (!title.trim()) { setError('Job title is required'); return; }
    setSaving(true); setError('');

    let finalClientId = clientId || null;
    if (showNewClient && newClientName.trim()) {
      const id = await createClientAndSave();
      if (!id) { setSaving(false); return; }
      finalClientId = id;
    }

    const payload = {
      user_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      status,
      client_id: finalClientId,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error: e } = isEdit
      ? await supabase.from('jobs').update(payload).eq('id', job!.id)
      : await supabase.from('jobs').insert(payload);

    if (e) { setError(e.message); setSaving(false); return; }
    onSaved();
  }

  async function handleDelete() {
    if (!confirm('Delete this job?')) return;
    await supabase.from('jobs').delete().eq('id', job!.id);
    onSaved();
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h2 style={s.modalTitle}>{isEdit ? 'Edit Job' : 'New Job'}</h2>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.body}>
          {error && <div style={s.error}>{error}</div>}

          <label style={s.label}>Job title *</label>
          <input style={s.input} placeholder="e.g. Bathroom renovation" value={title} onChange={e => setTitle(e.target.value)} />

          <label style={s.label}>Description</label>
          <textarea style={s.textarea} placeholder="Brief description of the work..." value={description} onChange={e => setDescription(e.target.value)} />

          <label style={s.label}>Status</label>
          <select style={s.input} value={status} onChange={e => setStatus(e.target.value as JobStatus)}>
            {STATUSES.map(st => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
          </select>

          <label style={s.label}>Client</label>
          {!showNewClient ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <select style={{ ...s.input, flex: 1 }} value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">No client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button style={s.secondaryBtn} onClick={() => setShowNewClient(true)}>+ New</button>
            </div>
          ) : (
            <div style={s.newClientBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>New client</span>
                <button style={s.linkBtn} onClick={() => setShowNewClient(false)}>Use existing</button>
              </div>
              <input style={{ ...s.input, marginBottom: 8 }} placeholder="Client name *" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
              <input style={{ ...s.input, marginBottom: 8 }} placeholder="Email" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} />
              <input style={s.input} placeholder="Phone" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
            </div>
          )}

          <label style={s.label}>Scheduled date</label>
          <input style={s.input} type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />

          <label style={s.label}>Notes</label>
          <textarea style={s.textarea} placeholder="Internal notes..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div style={s.footer}>
          {isEdit && <button style={s.deleteBtn} onClick={handleDelete}>Delete</button>}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create job'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8', padding: 4 },
  body: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  footer: { padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center' },
  error: { background: '#FEF2F2', color: '#DC2626', padding: '10px 12px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#1E293B', marginBottom: 6, marginTop: 14 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, color: '#0F172A', background: '#F8FAFC', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, color: '#0F172A', background: '#F8FAFC', boxSizing: 'border-box', minHeight: 80, resize: 'vertical' },
  newClientBox: { background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 },
  saveBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { background: '#fff', color: '#1E293B', border: '1px solid #D1D5DB', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer' },
  deleteBtn: { background: '#fff', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer' },
  secondaryBtn: { background: '#fff', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  linkBtn: { background: 'none', border: 'none', color: '#2563EB', fontSize: 12, cursor: 'pointer', padding: 0 },
};
