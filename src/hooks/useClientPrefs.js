import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useClientPrefs(userId) {
  const [prefs, setPrefs] = useState([]);

  async function load() {
    const { data } = await supabase
      .from('client_prefs').select('*').eq('user_id', userId);
    setPrefs(data || []);
  }

  useEffect(() => { if (userId) load(); }, [userId]);

  async function upsertPref(clientName, markup, email = null) {
    await supabase.from('client_prefs').upsert({
      user_id: userId,
      client_name: clientName,
      default_markup: markup,
      ...(email !== null && { email }),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,client_name' });
    await load();
  }

  const getMarkup = (clientName) =>
    prefs.find(p => p.client_name.toLowerCase() === clientName.toLowerCase())
      ?.default_markup ?? null;

  const getEmail = (clientName) =>
    prefs.find(p => p.client_name.toLowerCase() === clientName.toLowerCase())
      ?.email ?? null;

  return { prefs, upsertPref, getMarkup, getEmail };
}
