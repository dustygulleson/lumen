import { useState } from 'react';

export function InvoiceModal({ job, items, total, clientEmail, onClose }) {
  const [email, setEmail] = useState(clientEmail || '');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  async function handleSend() {
    if (!email) return;
    setStatus('sending');
    const res = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName: job.client_name, clientEmail: email, items, total, jobId: job.id })
    });
    setStatus(res.ok ? 'sent' : 'error');
    if (res.ok) setTimeout(onClose, 1500);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: '16px 16px 0 0',
        padding: '24px 20px 36px', width: '100%', maxWidth: 480,
        border: '1px solid var(--border)'
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Send Invoice</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
          {job.client_name} — <span className="num">${Number(total).toFixed(2)}</span> materials
        </p>

        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{item.qty}× {item.item_name}</span>
            <span className="num" style={{ color: 'var(--text-primary)' }}>${Number(item.billable).toFixed(2)}</span>
          </div>
        ))}

        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Client email address"
          type="email"
          style={{
            width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-strong)',
            borderRadius: 10, padding: '12px 14px', color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)', fontSize: 15, marginTop: 20, marginBottom: 12
          }}
        />

        <button
          onClick={handleSend}
          disabled={!email || status === 'sending' || status === 'sent'}
          style={{
            width: '100%', background: status === 'sent' ? 'var(--green)' : 'var(--amber)',
            color: '#1A0F00', border: 'none', borderRadius: 10,
            padding: '14px', fontSize: 16, fontWeight: 700,
            fontFamily: 'var(--font-ui)', cursor: 'pointer'
          }}
        >
          {status === 'idle' && 'Send Invoice'}
          {status === 'sending' && 'Sending…'}
          {status === 'sent' && '✓ Sent'}
          {status === 'error' && 'Failed — tap to retry'}
        </button>

        <button onClick={onClose} style={{
          width: '100%', background: 'none', border: 'none',
          color: 'var(--text-muted)', fontFamily: 'var(--font-ui)',
          fontSize: 14, padding: '12px', cursor: 'pointer', marginTop: 4
        }}>Cancel</button>
      </div>
    </div>
  );
}
