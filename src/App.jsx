import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { useInventory } from './hooks/useInventory';
import { useJobs } from './hooks/useJobs';
import { useReceipts } from './hooks/useReceipts';
import AuthScreen from './components/AuthScreen';
import ChatTab from './components/ChatTab';
import StockTab from './components/StockTab';
import JobsTab from './components/JobsTab';
import ReceiptsTab from './components/ReceiptsTab';

const TABS = [
  { id: 'chat', label: 'Chat', icon: '\u{1F4AC}' },
  { id: 'stock', label: 'Stock', icon: '\u{1F4E6}' },
  { id: 'jobs', label: 'Jobs', icon: '\u{1F4CB}' },
  { id: 'receipts', label: 'Receipts', icon: '\u{1F9FE}' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userId = user?.id;
  const { inventory, upsertItem, deductItem } = useInventory(userId);
  const { jobs, logUsage, markComplete } = useJobs(userId);
  const { receipts, addReceipt } = useReceipts(userId);

  async function handleAction(action, data) {
    if (action === 'add_inventory') {
      for (const item of data.items) {
        await upsertItem({
          name: item.name,
          category: item.category || 'General',
          unit: item.unit || 'ea',
          qty: item.qty,
          cost_per_unit: item.costPerUnit,
          last_bought: data.date || new Date().toISOString().split('T')[0]
        });
      }
      await addReceipt(data.store || 'Store', data.date || new Date().toISOString().split('T')[0], data.items);
    }

    if (action === 'log_usage') {
      if (data.needsConfirm) return; // waiting for user to confirm markup
      const resolvedItems = [];
      for (const item of data.items) {
        const result = await deductItem(item.name, item.qty);
        resolvedItems.push({
          name: item.name,
          qty: item.qty,
          unitCost: result?.unitCost ?? 0
        });
      }
      await logUsage(data.clientName, resolvedItems, data.markup ?? 20);
    }

    if (action === 'mark_job_complete') {
      await markComplete(data.clientName);
    }
  }

  if (loading) return null;
  if (!user) return <AuthScreen />;

  return (
    <div className="app-shell">
      {activeTab === 'chat' && (
        <ChatTab inventory={inventory} jobs={jobs} onAction={handleAction} />
      )}
      {activeTab === 'stock' && <StockTab inventory={inventory} />}
      {activeTab === 'jobs' && <JobsTab jobs={jobs} />}
      {activeTab === 'receipts' && <ReceiptsTab receipts={receipts} />}

      <div className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
