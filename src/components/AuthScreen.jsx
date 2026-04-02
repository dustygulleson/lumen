import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendLink(e) {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="auth-screen">
      <h1>Field Tracker</h1>
      <p>Inventory, billing, and receipt tracking for the job site.</p>
      {sent ? (
        <p className="sent-msg">Check your email for the login link.</p>
      ) : (
        <form onSubmit={sendLink} style={{ display: 'contents' }}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Login Link'}
          </button>
        </form>
      )}
    </div>
  );
}
