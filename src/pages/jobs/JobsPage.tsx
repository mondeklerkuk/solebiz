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
  enquiry:    { bg: '#F2F2F7', text: '#3C3C43', border: '#E5E5EA' },
  quoted:     { bg: '#EBF5FF', text: '#007AFF', border: '#BFD7FF' },
  confirmed:  { bg: '#EDFAF1', text: '#34C759', border: '#B7EFC5' },
  in_progress:{ bg: '#FFF5E6', text: '#FF9500', border: '#FFD9A0' },
  completed:  { bg: '#F5F0FF', text: '#AF52DE', border: '#DEC5F5' },
  archived:   { bg: '#F2F2F7', text: '#8E8E93', border: '#E5E5EA' },
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
  page: { padding: '32px 28px', maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, color: '#1C1C1E', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { fontSize: 14, color: '#8E8E93', margin: '4px 0 0' },
  addBtn: { background: '#007AFF', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  loading: { textAlign: 'center', color: '#8E8E93', padding: 48 },
};
