import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useReceipts(userId) {
  const [receipts, setReceipts] = useState([]);

  async function load() {
    const { data } = await supabase
      .from('receipts').select('*, receipt_items(*)')
      .eq('user_id', userId)
      .order('receipt_date', { ascending: false })
      .limit(100);
    setReceipts(data || []);
  }

  useEffect(() => { if (userId) load(); }, [userId]);

  async function addReceipt(store, date, items, imageUrl = null) {
    const { data: receipt } = await supabase.from('receipts')
      .insert({ user_id: userId, store, receipt_date: date, image_url: imageUrl })
      .select().single();
    const rows = items.map(i => ({
      receipt_id: receipt.id,
      item_name: i.name,
      qty: i.qty,
      unit_cost: i.cost_per_unit ?? i.costPerUnit
    }));
    await supabase.from('receipt_items').insert(rows);
    await load();
  }

  return { receipts, addReceipt };
}
