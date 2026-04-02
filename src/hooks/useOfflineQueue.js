import { useEffect, useState, useCallback } from 'react';
import { enqueue, dequeueAll, getQueueCount } from '../lib/offlineQueue';

export function useOfflineQueue(onSync) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);

  async function refreshCount() {
    setQueueCount(await getQueueCount());
  }

  useEffect(() => {
    refreshCount();
    const up = async () => {
      setIsOnline(true);
      const queued = await dequeueAll();
      if (queued.length && onSync) { await onSync(queued); refreshCount(); }
    };
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, [onSync]);

  const queueOrSend = useCallback(async (sendFn, payload) => {
    if (navigator.onLine) return sendFn(payload);
    await enqueue(payload);
    await refreshCount();
    return { queued: true, message: "No signal — saved locally. Will sync when you're back online." };
  }, []);

  return { isOnline, queueCount, queueOrSend };
}
