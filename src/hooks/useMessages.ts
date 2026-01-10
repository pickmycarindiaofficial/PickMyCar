import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  message_type: string;
  sent_at: string;
  edited_at?: string;
  is_deleted: boolean;
  attachment_url?: string;
  sender?: {
    username: string;
    avatar_url?: string;
  };
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? (payload.new as Message) : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await (supabase as any)
        .from('messages')
        .select(
          `
          *,
          sender:profiles!sender_id(username, avatar_url)
        `
        )
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setMessages((data as any) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!user || !conversationId || !messageText.trim()) return;

    try {
      const { error } = await (supabase as any).from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        message_text: messageText.trim(),
        message_type: 'text',
      });

      if (error) throw error;

      // Mark conversation as read
      await (supabase as any).rpc('mark_conversation_as_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const markAsRead = async () => {
    if (!user || !conversationId) return;

    try {
      await (supabase as any).rpc('mark_conversation_as_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
}
