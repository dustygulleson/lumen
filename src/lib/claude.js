const today = () => new Date().toLocaleDateString('en-US',
  { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export async function askClaude({ userMessage, imageBase64, imageMediaType, inventory, jobs, prefs, memoryWindow, isReceiptImage = false }) {
  const invSummary = inventory.map(i =>
    `${i.name} (${i.qty} ${i.unit} @ $${i.cost_per_unit}/${i.unit})`).join(', ') || 'Empty';

  const jobsSummary = jobs.map(j => {
    const total = j.job_items?.reduce((s, i) => s + Number(i.billable), 0) || 0;
    const lastMarkup = j.job_items?.slice(-1)[0]?.markup_pct ?? 20;
    return `${j.client_name}: $${total.toFixed(2)} billed, status=${j.status}, last markup=${lastMarkup}%`;
  }).join('\n') || 'No jobs yet';

  const prefsSummary = prefs.map(p =>
    `${p.client_name}: markup=${p.default_markup}%, email=${p.email || 'none'}`).join('\n') || 'None saved';

  const system = isReceiptImage ? `You are parsing a receipt photo for an electrician's inventory.
TODAY: ${today()}
Reply ONLY with valid JSON, no markdown:
{"reply":string,"action":"add_inventory","data":{"store":string,"date":"YYYY-MM-DD","items":[{"name":string,"category":string,"unit":string,"qty":number,"costPerUnit":number}]}}
Categories: Wiring, Devices, Fixtures, Breakers, Conduit, Hardware, Tools, Other. Skip unreadable lines, mention in reply. costPerUnit = unit price not line total.`

  : `You are a field assistant for an electrician. Chat-first, casual, fast. Use conversation history for context.
TODAY: ${today()}
INVENTORY: ${invSummary}
JOBS:\n${jobsSummary}
CLIENT PREFERENCES:\n${prefsSummary}

Reply ONLY with valid JSON, no markdown:
{"reply":string,"action":"none"|"add_inventory"|"log_usage"|"mark_job_complete"|"update_client_pref","data":{}}

add_inventory data: {"store":string,"date":"YYYY-MM-DD","items":[{"name":string,"category":string,"unit":string,"qty":number,"costPerUnit":number}]}
log_usage data: {"clientName":string,"markup":number|null,"needsConfirm":boolean,"date":"YYYY-MM-DD","items":[{"name":string,"qty":number}]}
  - Check CLIENT PREFERENCES first. If saved markup exists use it (needsConfirm=false). If not: needsConfirm=true, ask in one line.
mark_job_complete data: {"clientName":string}
update_client_pref data: {"clientName":string,"markup":number,"email":string|null}
  - Trigger when user says "always use X% for [client]" or gives a client email.

Rules: 1-3 sentences. Use backticks around dollar amounts in reply. Warn if stock drops below 10 after deduction. Never ask multiple questions. Reference conversation history naturally.`;

  const apiMessages = [
    ...memoryWindow.slice(0, -1),
    {
      role: 'user',
      content: imageBase64
        ? [
            { type: 'image', source: { type: 'base64', media_type: imageMediaType || 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: userMessage || 'Parse this receipt.' }
          ]
        : userMessage
    }
  ];

  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages, system })
  });

  const d = await res.json();
  const raw = d.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}
