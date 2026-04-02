import { useState } from 'react';
import { SkeletonCard } from './Skeleton';
import { ImageViewer } from './ImageViewer';

export default function ReceiptsTab({ recs }) {
  const { receipts } = recs;
  const [viewingImage, setViewingImage] = useState(null);

  if (receipts.length === 0) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          No receipts yet
        </div>
        <div style={{ fontSize: 13 }}>Tap 📷 in chat to log a purchase.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>
      {receipts.map(r => {
        const items = r.receipt_items || [];
        const total = items.reduce((s, i) => s + Number(i.qty) * Number(i.unit_cost), 0);

        return (
          <div key={r.id} style={{
            background: 'var(--bg-elevated)', borderRadius: 12,
            padding: 14, marginBottom: 8,
            border: '1px solid var(--border)',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{r.store}</div>
                <div className="num" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {r.receipt_date}
                </div>
              </div>
              {r.image_url && (
                <img
                  src={r.image_url}
                  onClick={() => setViewingImage(r.image_url)}
                  style={{
                    width: 60, height: 60, objectFit: 'cover',
                    borderRadius: 6, cursor: 'pointer',
                    border: '1px solid var(--border)'
                  }}
                />
              )}
            </div>

            {/* Line items */}
            {items.length > 0 && (
              <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                {items.map((ri, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '3px 0', fontSize: 13, color: 'var(--text-secondary)'
                  }}>
                    <span>{ri.item_name} <span className="num">×{ri.qty}</span></span>
                    <span className="num" style={{ color: 'var(--text-primary)' }}>
                      ${(Number(ri.qty) * Number(ri.unit_cost)).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)',
                  fontSize: 14
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total
                  </span>
                  <span className="num" style={{ fontWeight: 700, color: 'var(--amber)' }}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {viewingImage && (
        <ImageViewer url={viewingImage} onClose={() => setViewingImage(null)} />
      )}
    </div>
  );
}
