export async function sendToAssistant({ messages, system, imageBase64, imageMediaType }) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system, imageBase64, imageMediaType })
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('No response from assistant');
  return JSON.parse(text);
}
