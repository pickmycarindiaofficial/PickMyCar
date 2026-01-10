import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadCounts() {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      setUnreadNotifications(0);
      setLoading(false);
      return;
    }

    fetchUnreadCounts();

    // Subscribe to changes
    const messagesChannel = supabase
      .channel('messages-unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user]);

  const fetchUnreadCounts = async () => {
    if (!user) return;

    try {
      // Get unread messages count
      const { data: messageCount, error: messageError } = await (supabase as any)
        .rpc('get_unread_message_count', { p_user_id: user.id });

      if (!messageError) {
        setUnreadMessages(messageCount || 0);
      }

      // Get unread notifications count
      const { data: notificationCount, error: notificationError } = await (supabase as any)
        .rpc('get_unread_notification_count', { p_user_id: user.id });

      if (!notificationError) {
        setUnreadNotifications(notificationCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    unreadMessages,
    unreadNotifications,
    loading,
    refetch: fetchUnreadCounts,
  };
}
