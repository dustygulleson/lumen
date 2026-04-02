import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { useInventory } from './hooks/useInventory';
import { useJobs } from './hooks/useJobs';
import { useReceipts } from './hooks/useReceipts';
import { useChatHistory } from './hooks/useChatHistory';
import { useClientPrefs } from './hooks/useClientPrefs';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import ChatTab from './components/ChatTab';
import StockTab from './components/StockTab';
import JobsTab from './components/JobsTab';
import ReceiptsTab from './components/ReceiptsTab';

const BUILD = 'v2.0-20260401';

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState('chat');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) return null;
  if (!session) return <AuthScreen />;

  return <MainApp session={session} tab={tab} setTab={setTab} />;
}

function MainApp({ session, tab, setTab }) {
  const uid = session.user.id;
  const inv   = useInventory(uid);
  const jobs  = useJobs(uid);
  const recs  = useReceipts(uid);
  const chat  = useChatHistory(uid);
  const prefs = useClientPrefs(uid);

  const lowStockCount  = inv.inventory.filter(i => i.qty < 10).length;
  const activeJobCount = jobs.jobs.filter(j => j.status === 'active' && j.job_items?.length > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-app)' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'chat'     && <ChatTab     inv={inv} jobs={jobs} recs={recs} chat={chat} prefs={prefs} />}
        {tab === 'stock'    && <StockTab    inv={inv} />}
        {tab === 'jobs'     && <JobsTab     jobs={jobs} prefs={prefs} />}
        {tab === 'receipts' && <ReceiptsTab recs={recs} />}
      </div>
      <BottomNav active={tab} setActive={setTab} lowStockCount={lowStockCount} activeJobCount={activeJobCount} />
      <div style={{ textAlign: 'center', padding: '2px 0', fontSize: 9, color: 'var(--text-muted)', background: 'var(--bg-surface)' }}>
        {BUILD}
      </div>
    </div>
  );
}
