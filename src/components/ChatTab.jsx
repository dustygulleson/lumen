import { useState, useRef, useEffect, useCallback } from 'react';
import { askClaude } from '../lib/claude';
import { useOfflineQueue } from '../hooks/useOfflineQueue';

const CHIPS = [
  { label: '📷 Log receipt', action: 'camera' },
  { label: 'Used materials →', text: 'I used ' },
  { label: 'Client balance →', text: 'What does ' },
];

export default function ChatTab({ inv, jobs, recs, chat, prefs }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const onSync = useCallback(async (queued) => {
    for (const item of queued) {
      await processSend(item.payload);
    }
    setSyncMsg(`Synced ${queued.length} command${queued.length > 1 ? 's' : ''}`);
    setTimeout(() => setSyncMsg(null), 3000);
  }, [inv, jobs, recs, prefs]);

  const { isOnline, queueCount, queueOrSend } = useOfflineQueue(onSync);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, loading]);

  async function processSend({ userMessage, imageBase64, imageMediaType, isReceiptImage }) {
    const result = await askClaude({
      userMessage,
      imageBase64,
      imageMediaType,
      inventory: inv.inventory,
      jobs: jobs.jobs,
      prefs: prefs.prefs,
      memoryWindow: chat.getMemoryWindow(),
      isReceiptImage
    });

    await chat.addMessage('assistant', result.reply, {
      action_taken: result.action,
      has_image: !!imageBase64
    });

    await processAction(result);
    return result;
  }

  async function processAction(result) {
    if (!result.action || result.action === 'none') return;

    if (result.action === 'add_inventory') {
      const d = result.data;
      for (const item of d.items) {
        await inv.upsertItem({
          name: item.name,
          category: item.category || 'General',
          unit: item.unit || 'ea',
          qty: item.qty,
          cost_per_unit: item.costPerUnit,
          last_bought: d.date
        });
      }
      await recs.addReceipt(d.store, d.date, d.items);
    }

    if (result.action === 'log_usage' && !result.data.needsConfirm) {
      const d = result.data;
      const itemsWithCost = [];
      for (const item of d.items) {
        const deducted = await inv.deductItem(item.name, item.qty);
        itemsWithCost.push({ ...item, unitCost: deducted?.unitCost || 0 });
      }
      await jobs.logUsage(d.clientName, itemsWithCost, d.markup || 20);
    }

    if (result.action === 'update_client_pref') {
      const d = result.data;
      await prefs.upsertPref(d.clientName, d.markup, d.email || null);
    }

    if (result.action === 'mark_job_complete') {
      await jobs.markComplete(result.data.clientName);
    }
  }

  async function handleSend() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);

    await chat.addMessage('user', msg);

    const payload = { userMessage: msg, isReceiptImage: false };
    const result = await queueOrSend(processSend, payload);

    if (result?.queued) {
      await chat.addMessage('assistant', result.message);
    }

    setLoading(false);
  }

  async function handleImageCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });

    const userMsg = 'Parse this receipt.';
    await chat.addMessage('user', userMsg, { has_image: true });

    const payload = {
      userMessage: userMsg,
      imageBase64: base64,
      imageMediaType: file.type || 'image/jpeg',
      isReceiptImage: true
    };

    const result = await queueOrSend(processSend, payload);
    if (result?.queued) {
      await chat.addMessage('assistant', result.message);
    }

    setLoading(false);
    e.target.value = '';
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChip(chip) {
    if (chip.action === 'camera') {
      fileInputRef.current?.click();
    } else {
      setInput(chip.text);
      textareaRef.current?.focus();
    }
  }

  function formatReply(text) {
    const parts = text.split(/(`\$[\d,.]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`$') && part.endsWith('`')) {
        return <span key={i} className="num" style={{ fontWeight: 600 }}>{part.slice(1, -1)}</span>;
      }
      return part;
    });
  }

  function renderMessage(msg) {
    const isUser = msg.role === 'user';

    return (
      <div key={msg.id} style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
      }}>
        <div style={{
          padding: '10px 14px',
          borderRadius: 12,
          lineHeight: 1.5,
          fontSize: 14,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: isUser ? 'var(--amber)' : 'var(--bg-elevated)',
          color: isUser ? '#1A0F00' : 'var(--text-primary)',
          border: isUser ? 'none' : '1px solid var(--border)',
        }}>
          {formatReply(msg.content)}
        </div>
        {msg.has_image && isUser && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
            📷 Photo attached
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Offline banner */}
      {!isOnline && (
        <div style={{
          background: 'var(--amber-dim)', borderBottom: '1px solid var(--amber-border)',
          padding: '8px 16px', fontSize: 12, color: 'var(--amber)',
          fontWeight: 600, textAlign: 'center', flexShrink: 0
        }}>
          No signal — commands queue locally
          {queueCount > 0 && <span className="num"> ({queueCount} queued)</span>}
        </div>
      )}

      {/* Sync banner */}
      {syncMsg && (
        <div style={{
          background: 'var(--green-dim)', borderBottom: '1px solid rgba(34,197,94,0.25)',
          padding: '8px 16px', fontSize: 12, color: 'var(--green)',
          fontWeight: 600, textAlign: 'center', flexShrink: 0
        }}>
          {syncMsg}
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12
      }}>
        {!chat.loaded && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
            Loading messages…
          </div>
        )}

        {chat.loaded && chat.messages.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 40 }}>
            What are you working on today?
          </div>
        )}

        {chat.messages.map(renderMessage)}

        {/* Typing indicator */}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 4, padding: '10px 14px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: 4,
                background: 'var(--amber)',
                animation: `skeleton-pulse 1s ease-in-out ${i * 0.15}s infinite`
              }} />
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick chips */}
      {!input && !loading && (
        <div style={{
          display: 'flex', gap: 8, padding: '0 16px 8px',
          overflowX: 'auto', flexShrink: 0
        }}>
          {CHIPS.map((chip, i) => (
            <button key={i} onClick={() => handleChip(chip)} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '6px 14px', fontSize: 13,
              color: 'var(--text-secondary)', whiteSpace: 'nowrap',
              cursor: 'pointer', fontFamily: 'var(--font-ui)'
            }}>
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-app)', flexShrink: 0,
        alignItems: 'flex-end'
      }}>
        <button onClick={() => fileInputRef.current?.click()} style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 10, width: 44, height: 44,
          fontSize: 20, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-primary)'
        }}>
          📷
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What'd you use?"
          rows={1}
          style={{
            flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-strong)',
            borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)', fontSize: 15, resize: 'none',
            maxHeight: 120, lineHeight: 1.4
          }}
        />

        <button onClick={handleSend} disabled={!input.trim() || loading} style={{
          background: input.trim() ? 'var(--amber)' : 'var(--bg-elevated)',
          color: input.trim() ? '#1A0F00' : 'var(--text-muted)',
          border: 'none', borderRadius: 10, width: 44, height: 44,
          fontSize: 18, fontWeight: 700, cursor: 'pointer', flexShrink: 0
        }}>
          ↑
        </button>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImageCapture}
        />
      </div>
    </div>
  );
}
