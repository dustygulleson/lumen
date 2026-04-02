export default function StockTab({ inventory }) {
  const grouped = {};
  for (const item of inventory) {
    const cat = item.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  const categories = Object.keys(grouped).sort();

  if (inventory.length === 0) {
    return (
      <div className="tab-content" style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 60 }}>
        <p>No inventory yet.</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>Snap a receipt or type what you bought.</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      {categories.map(cat => (
        <div key={cat}>
          <h3 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '16px 0 8px', letterSpacing: 1 }}>
            {cat}
          </h3>
          {grouped[cat].map(item => (
            <div className="card" key={item.id}>
              <h3>{item.name}</h3>
              <p>
                <span className="qty">{item.qty} {item.unit}</span>
                {item.cost_per_unit > 0 && ` — $${Number(item.cost_per_unit).toFixed(2)} per ${item.unit}`}
              </p>
              {item.last_bought && <p>Last bought: {item.last_bought}</p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
