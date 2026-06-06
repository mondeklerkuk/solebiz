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
  enquiry:    { bg: '#F8FAFC', text: '#1E293B', border: '#E2E8F0' },
  quoted:     { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  confirmed:  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  in_progress:{ bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  completed:  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  archived:   { bg: '#F8FAFC', text: '#94A3B8', border: '#E2E8F0' },
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
  page: { padding: '36px 40px', maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 },
  subtitle: { fontSize: 14, color: '#64748B', margin: '4px 0 0' },
  addBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  loading: { textAlign: 'center', color: '#64748B', padding: 48 },
};
