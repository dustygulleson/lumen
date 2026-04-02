import { useState, useRef, useEffect } from 'react';
import { sendToAssistant } from '../lib/claude';

const BASE_SYSTEM = `You are a job-site inventory assistant for an electrician. Fast, casual, no fluff. He's on a job site.

INVENTORY: {inventory_json}
JOBS: {jobs_with_items_json}
TODAY: {date}

Reply ONLY with a valid JSON object. No markdown. No preamble. Format:
{
  "reply": "2-4 line response",
  "action": "none" | "add_inventory" | "log_usage" | "mark_job_complete",
  "data": {}
}

add_inventory → data:
{
  "store": string,
  "date": string,
  "items": [{ "name": string, "category": string, "unit": string, "qty": number, "costPerUnit": number }]
}

log_usage → data:
{
  "clientName": string,
  "markup": number | null,
  "needsConfirm": boolean,
  "date": string,
  "items": [{ "name": string, "qty": number }]
}
If markup not stated: needsConfirm=true, markup=null, ask "20% okay?" in reply.
If confirmed or stated: needsConfirm=false.

mark_job_complete → data: { "clientName": string }

Billing queries ("what does X owe"): action="none", compute from jobs state, put itemized breakdown in reply.
Stock queries: action="none", answer from inventory.

Rules:
- 2-4 lines max
- Round $ to 2 decimal places
- Be flexible with item names (12-2 = 12/2 Romex NM-B)
- If inventory match is uncertain, use the closest match and note it`;

const RECEIPT_SYSTEM = `You are parsing a receipt photo for an electrician's inventory system.
TODAY: {date}

Extract every readable line item from this receipt photo.

Reply ONLY with a valid JSON object. No markdown. No preamble:
{
  "reply": "Short confirmation — what you found and anything you couldn't read",
  "action": "add_inventory",
  "data": {
    "store": string (from receipt header, or "Store" if unclear),
    "date": string (from receipt, or today's date),
    "items": [{ "name": string, "category": string, "unit": string, "qty": number, "costPerUnit": number }]
  }
}

Category options: Wiring, Devices, Fixtures, Breakers, Hardware, Conduit, Tools, Other
Unit options: ea, ft, roll, box, bag, pair, set

Rules:
- Skip lines you cannot read — mention them in reply
- If qty is unclear, default to 1
- costPerUnit = unit price (not line total)
- Round prices to 2 decimal places
- Infer unit from item type (wire = ft, outlets = ea, etc.)`;

export default function ChatTab({ inventory, jobs, onAction }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function buildSystem(isReceipt) {
    const today = new Date().toISOString().split('T')[0];
    if (isReceipt) {
      return RECEIPT_SYSTEM.replace('{date}', today);
    }
    const invJson = JSON.stringify(
      inventory.map(i => ({ name: i.name, category: i.category, qty: i.qty, unit: i.unit, costPerUnit: i.cost_per_unit }))
    );
    const jobsJson = JSON.stringify(
      jobs.map(j => ({
        client: j.client_name,
        status: j.status,
        items: (j.job_items || []).map(ji => ({
          item: ji.item_name, qty: ji.qty, unitCost: ji.unit_cost, markup: ji.markup_pct, billable: ji.billable, date: ji.logged_date
        }))
      }))
    );
    return BASE_SYSTEM
      .replace('{inventory_json}', invJson)
      .replace('{jobs_with_items_json}', jobsJson)
      .replace('{date}', today);
  }

  async function handleImageCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setPendingImage({ base64, mediaType: file.type || 'image/jpeg' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text && !pendingImage) return;

    const userMsg = pendingImage
      ? `[Receipt photo attached] ${text || 'Parse this receipt'}`
      : text;

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const isReceipt = !!pendingImage;
      const result = await sendToAssistant({
        messages: apiMessages,
        system: buildSystem(isReceipt),
        imageBase64: pendingImage?.base64,
        imageMediaType: pendingImage?.mediaType
      });

      setPendingImage(null);
      setMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);

      if (result.action && result.action !== 'none') {
        await onAction(result.action, result.data);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40%' }}>
            <p style={{ fontSize: 32 }}>&#9889;</p>
            <p>Type a command or snap a receipt</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
        ))}
        {loading && <div className="loading">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-bar">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImageCapture}
        />
        <button
          className="camera-btn"
          onClick={() => fileInputRef.current.click()}
          title="Take photo"
        >&#128247;</button>
        <form onSubmit={handleSend} style={{ display: 'contents' }}>
          <input
            type="text"
            placeholder={pendingImage ? 'Photo ready — add note or send' : 'e.g. "used 50ft 12-2 at Smith job"'}
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </>
  );
}
