import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useJobs(userId) {
  const [jobs, setJobs] = useState([]);

  async function load() {
    const { data: jobRows } = await supabase
      .from('jobs').select('*, job_items(*)').eq('user_id', userId)
      .order('created_at', { ascending: false });
    setJobs(jobRows || []);
  }

  useEffect(() => { if (userId) load(); }, [userId]);

  async function logUsage(clientName, items, markup = 20) {
    let job = jobs.find(j => j.client_name.toLowerCase() === clientName.toLowerCase());
    if (!job) {
      const { data } = await supabase.from('jobs')
        .insert({ user_id: userId, client_name: clientName }).select().single();
      job = data;
    }
    const rows = items.map(i => ({
      job_id: job.id,
      item_name: i.name,
      qty: i.qty,
      unit_cost: i.unitCost,
      markup_pct: markup,
      logged_date: new Date().toISOString().split('T')[0]
    }));
    await supabase.from('job_items').insert(rows);
    await load();
  }

  async function markComplete(clientName) {
    const job = jobs.find(j => j.client_name.toLowerCase() === clientName.toLowerCase());
    if (!job) return;
    await supabase.from('jobs').update({ status: 'complete' }).eq('id', job.id);
    await load();
  }

  return { jobs, logUsage, markComplete };
}
