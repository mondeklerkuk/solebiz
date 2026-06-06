import { STATUS_LABELS, STATUS_COLORS } from './JobsPage';

const COLUMNS = ['enquiry', 'quoted', 'confirmed', 'in_progress', 'completed'];

export default function JobBoard({ jobs, onStatusChange, onEdit }: any) {
  return (
    <div style={s.board}>
      {COLUMNS.map(status => {
        const col = STATUS_COLORS[status];
        const colJobs = jobs.filter((j: any) => j.status === status);
        return (
          <div key={status} style={s.column}>
            <div style={{ ...s.colHeader, background: col.bg, border: `1px solid ${col.border}` }}>
              <span style={{ ...s.colLabel, color: col.text }}>{STATUS_LABELS[status]}</span>
              <span style={{ ...s.colCount, color: col.text }}>{colJobs.length}</span>
            </div>
            <div style={s.cards}>
              {colJobs.length === 0 && <div style={s.empty}>No jobs</div>}
              {colJobs.map((job: any) => (
                <JobCard key={job.id} job={job} onStatusChange={onStatusChange} onEdit={onEdit} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const NEXT: Record<string, string> = {
  enquiry: 'quoted', quoted: 'confirmed', confirmed: 'in_progress', in_progress: 'completed',
};

function JobCard({ job, onStatusChange, onEdit }: any) {
  const col = STATUS_COLORS[job.status];
  const next = NEXT[job.status];
  return (
    <div style={s.card} onClick={() => onEdit(job)}>
      <div style={s.cardTitle}>{job.title}</div>
      {job.client && <div style={s.cardClient}>👤 {job.client.name}</div>}
      {job.description && <div style={s.cardDesc}>{job.description.slice(0, 80)}{job.description.length > 80 ? '…' : ''}</div>}
      {job.scheduled_at && (
        <div style={s.cardDate}>📅 {new Date(job.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
      )}
      <div style={s.cardFooter}>
        <span style={{ ...s.badge, background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
          {STATUS_LABELS[job.status]}
        </span>
        {next && (
          <button style={s.moveBtn} onClick={e => { e.stopPropagation(); onStatusChange(job.id, next); }}>
            → {STATUS_LABELS[next]}
          </button>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  board: { display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 },
  column: { minWidth: 200, flex: '1 1 200px' },
  colHeader: { borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  colLabel: { fontSize: 13, fontWeight: 600 },
  colCount: { fontSize: 13, fontWeight: 700, opacity: 0.7 },
  cards: { display: 'flex', flexDirection: 'column', gap: 10 },
  empty: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '20px 0' },
  card: { background: '#fff', borderRadius: 10, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'pointer', border: '1px solid #F3F4F6' },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 },
  cardClient: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#9CA3AF', marginBottom: 6, lineHeight: '1.4' },
  cardDate: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badge: { fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 },
  moveBtn: { fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' },
};
