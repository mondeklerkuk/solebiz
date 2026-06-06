import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import JobBoard from './JobBoard';
import JobModal from './JobModal';

export const STATUS_LABELS: Record<string, string> = {
  enquiry: 'Enquiry', quoted: 'Quoted', confirmed: 'Confirmed',
  in_progress: 'In Progress', completed: 'Completed', archived: 'Archived',
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  enquiry:    { bg: 'var(--bg-primary)', text: 'var(--text-primary)', border: 'rgba(142,142,147,0.2)' },
  quoted:     { bg: 'rgba(0,113,227,0.12)', text: 'var(--accent-blue)', border: 'rgba(0,113,227,0.3)' },
  confirmed:  { bg: 'rgba(48,209,88,0.12)', text: '#15803D', border: 'rgba(48,209,88,0.3)' },
  in_progress:{ bg: 'rgba(255,159,10,0.12)', text: '#C2410C', border: 'rgba(255,159,10,0.3)' },
  completed:  { bg: 'rgba(191,90,242,0.12)', text: 'var(--accent-purple)', border: 'rgba(191,90,242,0.3)' },
  archived:   { bg: 'var(--bg-primary)', text: 'var(--text-tertiary)', border: 'rgba(142,142,147,0.2)' },
};

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  useEffect(() => { if (user) { fetchJobs(); fetchClients(); } }, [user]);

  async function fetchJobs() {
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('*, client:clients(name, email, phone)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name');
    setClients(data || []);
  }

  async function updateJobStatus(jobId: string, status: string) {
    await supabase.from('jobs').update({ status, updated_at: new Date().toISOString() }).eq('id', jobId);
    setJobs(prev => prev.map((j: any) => j.id === jobId ? { ...j, status } : j));
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Jobs</h1>
          <p style={s.subtitle}>{jobs.length} job{jobs.length !== 1 ? 's' : ''} total</p>
        </div>
        <button style={s.addBtn} onClick={() => { setEditingJob(null); setModalOpen(true); }}>+ New Job</button>
      </div>
      {loading ? (
        <div style={s.loading}>Loading jobs...</div>
      ) : (
        <JobBoard jobs={jobs} onStatusChange={updateJobStatus} onEdit={(job: any) => { setEditingJob(job); setModalOpen(true); }} />
      )}
      {modalOpen && (
        <JobModal job={editingJob} clients={clients} userId={user.id}
          onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchJobs(); }} />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,40px)', maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 'var(--text-24)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
  subtitle: { fontSize: 'var(--text-13)', color: 'var(--text-secondary)', margin: '4px 0 0' },
  addBtn: { background: 'var(--accent-blue)', color: 'var(--bg-card)', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 'var(--text-13)', fontWeight: 600, cursor: 'pointer' },
  loading: { textAlign: 'center', color: 'var(--text-secondary)', padding: 48 },
};
