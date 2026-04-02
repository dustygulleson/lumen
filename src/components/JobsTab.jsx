export default function JobsTab({ jobs }) {
  if (jobs.length === 0) {
    return (
      <div className="tab-content" style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 60 }}>
        <p>No jobs yet.</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>Log material usage to create a job.</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      {jobs.map(job => {
        const items = job.job_items || [];
        const total = items.reduce((s, i) => s + Number(i.billable || 0), 0);
        return (
          <div className="card" key={job.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{job.client_name}</h3>
              <span className={`badge ${job.status}`}>{job.status}</span>
            </div>
            {items.length > 0 && (
              <div className="job-items">
                {items.map((ji, idx) => (
                  <div className="row" key={idx}>
                    <span>{ji.item_name} x{ji.qty}</span>
                    <span>${Number(ji.billable || 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="row total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
