import { SkeletonCard } from './Skeleton';

export default function StockTab({ inv }) {
  const { inventory } = inv;
  const isLoading = !inventory || inventory.length === 0;

  // Group by category
  const grouped = {};
  for (const item of inventory) {
    const cat = item.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }
  const categories = Object.keys(grouped).sort();

  if (isLoading && inventory.length === 0) {
    // Could be loading or truly empty — show skeletons briefly
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          No inventory yet
        </div>
        <div style={{ fontSize: 13 }}>Tell me what you bought.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>
      {categories.map(cat => (
        <div key={cat}>
          <div style={{
            fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.1em', fontWeight: 700, margin: '20px 0 8px',
          }}>
            {cat}
          </div>
          {grouped[cat].map(item => {
            const isLow = item.qty > 0 && item.qty < 10;
            const isOut = item.qty === 0;
            const borderColor = isOut ? 'var(--red)' : isLow ? 'var(--amber-border)' : 'var(--border)';

            return (
              <div key={item.id} style={{
                background: 'var(--bg-elevated)', borderRadius: 12,
                padding: 14, marginBottom: 8,
                border: `1px solid ${borderColor}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</span>
                  {isOut && (
                    <span style={{
                      background: 'var(--red-dim)', color: 'var(--red)',
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 99, fontFamily: 'var(--font-mono)'
                    }}>OUT</span>
                  )}
                  {isLow && !isOut && (
                    <span style={{
                      background: 'var(--amber-dim)', color: 'var(--amber)',
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 99, fontFamily: 'var(--font-mono)'
                    }}>LOW</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>
                    <span className="num" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {item.qty}
                    </span> {item.unit}
                    {item.cost_per_unit > 0 && (
                      <> · <span className="num">${Number(item.cost_per_unit).toFixed(2)}</span>/{item.unit}</>
                    )}
                  </span>
                  {item.last_bought && (
                    <span className="num" style={{ fontSize: 12 }}>{item.last_bought}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
