export function BottomNav({ active, setActive, lowStockCount = 0, activeJobCount = 0 }) {
  const tabs = [
    { id: 'chat',     icon: '💬', label: 'Chat' },
    { id: 'stock',    icon: '📦', label: 'Stock',    badge: lowStockCount },
    { id: 'jobs',     icon: '🔧', label: 'Jobs',     badge: activeJobCount },
    { id: 'receipts', icon: '🧾', label: 'Receipts' },
  ];

  return (
    <nav style={{
      display: 'flex',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      flexShrink: 0
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActive(t.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '10px 4px 8px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: active === t.id ? 'var(--amber)' : 'var(--text-muted)',
          position: 'relative', gap: 3, fontFamily: 'var(--font-ui)'
        }}>
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {t.label}
          </span>
          {t.badge > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 'calc(50% - 18px)',
              background: 'var(--red)', color: '#fff',
              fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
              width: 16, height: 16, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{t.badge > 9 ? '9+' : t.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
