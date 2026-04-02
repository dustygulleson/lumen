export default function ReceiptsTab({ receipts }) {
  if (receipts.length === 0) {
    return (
      <div className="tab-content" style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 60 }}>
        <p>No receipts yet.</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>Snap a photo of a receipt in the chat tab.</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      {receipts.map(r => {
        const items = r.receipt_items || [];
        const total = items.reduce((s, i) => s + Number(i.qty) * Number(i.unit_cost), 0);
        return (
          <div className="card" key={r.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{r.store}</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.receipt_date}</span>
            </div>
            {items.length > 0 && (
              <div className="job-items" style={{ marginTop: 6 }}>
                {items.map((ri, idx) => (
                  <div className="row" key={idx}>
                    <span>{ri.item_name} x{ri.qty}</span>
                    <span>${(Number(ri.qty) * Number(ri.unit_cost)).toFixed(2)}</span>
                  </div>
                ))}
                <div className="row total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            )}
            {r.image_url && (
              <a href={r.image_url} target="_blank" rel="noopener" style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8, display: 'block' }}>
                View receipt photo
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
