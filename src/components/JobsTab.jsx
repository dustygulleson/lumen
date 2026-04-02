import { useState } from 'react';
import { SkeletonCard } from './Skeleton';
import { InvoiceModal } from './InvoiceModal';

export default function JobsTab({ jobs, prefs }) {
  const [expanded, setExpanded] = useState({});
  const [invoiceJob, setInvoiceJob] = useState(null);

  const jobList = jobs.jobs;
  const activeJobs = jobList.filter(j => j.status === 'active');
  const completedJobs = jobList.filter(j => j.status === 'complete');

  if (jobList.length === 0) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function renderJob(job, dimmed = false) {
    const items = job.job_items || [];
    const total = items.reduce((s, i) => s + Number(i.billable || 0), 0);
    const visits = new Set(items.map(i => i.logged_date)).size;
    const isExpanded = expanded[job.id];
    const clientEmail = prefs?.getEmail?.(job.client_name) || '';

    // Group items by date
    const byDate = {};
    items.forEach(i => {
      const d = i.logged_date || 'Unknown';
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(i);
    });

    return (
      <div key={job.id} style={{
        background: 'var(--bg-elevated)', borderRadius: 12,
        padding: 14, marginBottom: 8,
        border: '1px solid var(--border)',
        opacity: dimmed ? 0.5 : 1
      }}>
        {/* Header */}
        <div onClick={() => toggleExpand(job.id)} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer'
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{job.client_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              <span className="num">{visits}</span> visit{visits !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--amber)' }}>
              ${total.toFixed(2)}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: job.status === 'active' ? 'var(--amber-dim)' : 'var(--green-dim)',
              color: job.status === 'active' ? 'var(--amber)' : 'var(--green)',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              {job.status}
            </span>
          </div>
        </div>

        {/* Expandable line items */}
        {isExpanded && items.length > 0 && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            {Object.entries(byDate).sort().map(([date, dateItems]) => (
              <div key={date} style={{ marginBottom: 10 }}>
                <div className="num" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {date}
                </div>
                {dateItems.map((ji, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '4px 0', fontSize: 13, color: 'var(--text-secondary)'
                  }}>
                    <span>{ji.item_name} <span className="num">×{ji.qty}</span></span>
                    <span className="num" style={{ color: 'var(--text-primary)' }}>
                      ${Number(ji.billable || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons for active jobs */}
        {job.status === 'active' && items.length > 0 && isExpanded && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => setInvoiceJob(job)} style={{
              flex: 1, background: 'var(--amber)', color: '#1A0F00',
              border: 'none', borderRadius: 8, padding: '10px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-ui)'
            }}>
              Send Invoice
            </button>
            <button onClick={() => jobs.markComplete(job.client_name)} style={{
              flex: 1, background: 'var(--bg-input)', color: 'var(--text-secondary)',
              border: '1px solid var(--border-strong)', borderRadius: 8, padding: '10px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-ui)'
            }}>
              Mark Complete
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>
      {activeJobs.length === 0 && completedJobs.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            No jobs yet
          </div>
          <div style={{ fontSize: 13 }}>Log material usage to start billing.</div>
        </div>
      )}

      {activeJobs.map(j => renderJob(j))}

      {completedJobs.length > 0 && (
        <>
          <div style={{
            fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.1em', fontWeight: 700, margin: '20px 0 8px'
          }}>
            Completed
          </div>
          {completedJobs.map(j => renderJob(j, true))}
        </>
      )}

      {invoiceJob && (
        <InvoiceModal
          job={invoiceJob}
          items={invoiceJob.job_items || []}
          total={(invoiceJob.job_items || []).reduce((s, i) => s + Number(i.billable || 0), 0)}
          clientEmail={prefs?.getEmail?.(invoiceJob.client_name) || ''}
          onClose={() => setInvoiceJob(null)}
        />
      )}
    </div>
  );
}
