import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const WINDOW = 40;

export function useChatHistory(userId) {
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80)
      .then(({ data }) => {
        setMessages((data || []).reverse());
        setLoaded(true);
      });
  }, [userId]);

  const addMessage = useCallback(async (role, content, meta = {}) => {
    const row = { user_id: userId, role, content, ...meta };
    const { data } = await supabase
      .from('chat_messages').insert(row).select().single();
    setMessages(prev => [...prev, data]);
    return data;
  }, [userId]);

  const getMemoryWindow = useCallback(() =>
    messages.slice(-WINDOW).map(m => ({ role: m.role, content: m.content }))
  , [messages]);

  return { messages, addMessage, getMemoryWindow, loaded };
}
