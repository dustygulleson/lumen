export function ImageViewer({ url, onClose }) {
  if (!url) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <img
        src={url}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: 8, objectFit: 'contain' }}
      />
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16,
        background: 'rgba(255,255,255,0.1)', border: 'none',
        borderRadius: 20, color: '#fff', fontSize: 18,
        width: 36, height: 36, cursor: 'pointer'
      }}>×</button>
    </div>
  );
}
