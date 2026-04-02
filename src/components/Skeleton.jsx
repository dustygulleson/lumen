export function SkeletonBar({ width = '100%', height = 14, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'var(--bg-elevated)',
      animation: 'skeleton-pulse 1.4s ease-in-out infinite',
      ...style
    }} />
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-elevated)', borderRadius: 12,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <SkeletonBar width="55%" />
        <SkeletonBar width="18%" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <SkeletonBar width="35%" height={11} />
        <SkeletonBar width="22%" height={11} />
      </div>
    </div>
  );
}
