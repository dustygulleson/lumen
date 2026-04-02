import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { clientName, clientEmail, items, total } = req.body;
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const rows = items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#ccc;font-size:14px;">${i.item_name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;text-align:right;font-family:monospace;color:#ccc;font-size:14px;">${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;text-align:right;font-family:monospace;color:#f0f0f0;font-size:14px;">$${Number(i.billable).toFixed(2)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><body style="background:#0d0d0d;color:#f0f0f0;font-family:'DM Sans',sans-serif;padding:40px 24px;max-width:480px;margin:0 auto;">
    <div style="background:#f59e0b;width:40px;height:40px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:20px;">⚡</div>
    <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">Materials Invoice</h1>
    <p style="color:#888;font-family:monospace;font-size:13px;margin:0 0 24px;">${date}</p>
    <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">Prepared for</p>
    <p style="font-size:18px;font-weight:700;margin:0 0 24px;">${clientName}</p>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="text-align:left;padding:8px 0;border-bottom:1px solid #333;color:#666;font-size:11px;text-transform:uppercase;font-weight:500;">Item</th>
        <th style="text-align:right;padding:8px 0;border-bottom:1px solid #333;color:#666;font-size:11px;text-transform:uppercase;font-weight:500;">Qty</th>
        <th style="text-align:right;padding:8px 0;border-bottom:1px solid #333;color:#666;font-size:11px;text-transform:uppercase;font-weight:500;">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:16px;border-top:1px solid #333;margin-top:8px;">
      <span style="color:#888;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Total Materials</span>
      <span style="font-size:24px;font-weight:700;color:#f59e0b;font-family:monospace;">$${Number(total).toFixed(2)}</span>
    </div>
    <p style="color:#444;font-size:11px;margin-top:40px;">Materials only. Labor billed separately.</p>
  </body></html>`;

  try {
    await resend.emails.send({
      from: process.env.INVOICE_FROM_EMAIL,
      to: clientEmail,
      subject: `Materials Invoice — ${clientName} — ${date}`,
      html
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
