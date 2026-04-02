import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useInventory(userId) {
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId)
      .order('name')
      .then(({ data }) => setInventory(data || []));

    const sub = supabase
      .channel('inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        supabase.from('inventory').select('*').eq('user_id', userId).order('name')
          .then(({ data }) => setInventory(data || []));
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [userId]);

  async function upsertItem(item) {
    const existing = inventory.find(i =>
      i.name.toLowerCase().replace(/[^a-z0-9]/g, '') ===
      item.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (existing) {
      return supabase.from('inventory').update({
        qty: existing.qty + item.qty,
        cost_per_unit: item.cost_per_unit,
        last_bought: item.last_bought
      }).eq('id', existing.id);
    }
    return supabase.from('inventory').insert({ ...item, user_id: userId });
  }

  async function deductItem(name, qty) {
    const item = inventory.find(i =>
      i.name.toLowerCase().includes(name.toLowerCase().split(' ')[0]) ||
      name.toLowerCase().includes(i.name.toLowerCase().split(' ')[0])
    );
    if (!item) return null;
    const newQty = Math.max(0, item.qty - qty);
    await supabase.from('inventory').update({ qty: newQty }).eq('id', item.id);
    return { item, deducted: qty, unitCost: item.cost_per_unit };
  }

  return { inventory, upsertItem, deductItem };
}
