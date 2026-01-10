import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

interface RealtimeContextType {
  isConnected: boolean;
  unreadMessages: number;
  unreadNotifications: number;
  newLeadsCount: number;
  refreshUnreadCounts: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, roles } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  const refreshUnreadCounts = async () => {
    if (!user) return;

    try {
      // Fetch unread messages count
      const { data: messagesData } = await (supabase as any).rpc('get_unread_message_count', {
        p_user_id: user.id
      }) as any;
      setUnreadMessages(messagesData || 0);

      // Fetch unread notifications count
      const { data: notificationsData } = await (supabase as any).rpc('get_unread_notification_count', {
        p_user_id: user.id
      }) as any;
      setUnreadNotifications(notificationsData || 0);

      // For dealers, fetch new leads count
      if (roles.includes('dealer')) {
        const { count } = await (supabase as any)
          .from('car_enquiries')
          .select('*', { count: 'exact', head: true })
          .eq('dealer_id', user.id)
          .eq('status', 'new') as any;
        setNewLeadsCount(count || 0);
      }
    } catch (error) {
      // Silent fail
    }
  };

  useEffect(() => {
    if (!user) return;

    // Initial counts
    refreshUnreadCounts();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          refreshUnreadCounts();

          // Show toast notification if message is not from current user
          if (payload.new.sender_id !== user.id) {
            toast({
              title: 'New Message',
              description: 'You have received a new message',
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to new notifications
    const notificationsChannel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          refreshUnreadCounts();

          toast({
            title: 'New Notification',
            description: payload.new.message || 'You have a new notification',
          });
        }
      )
      .subscribe();

    // Subscribe to new enquiries (for dealers)
    let enquiriesChannel: any;
    if (roles.includes('dealer')) {
      enquiriesChannel = supabase
        .channel('realtime-enquiries')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'car_enquiries',
            filter: `dealer_id=eq.${user.id}`,
          },
          (payload) => {
            setNewLeadsCount(prev => prev + 1);

            toast({
              title: '🎉 New Lead!',
              description: 'You have received a new enquiry',
            });
          }
        )
        .subscribe();
    }

    // Subscribe to AI suggestions (for dealers and powerdesk)
    let suggestionsChannel: any;
    if (roles.includes('dealer') || roles.includes('powerdesk')) {
      suggestionsChannel = supabase
        .channel('realtime-ai-suggestions')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ai_suggestions',
            filter: `target_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new.priority === 'high') {
              toast({
                title: '💡 New AI Suggestion',
                description: payload.new.title,
              });
            }
          }
        )
        .subscribe();
    }

    // Subscribe to demand gap notifications (for dealers)
    let demandGapChannel: any;
    if (roles.includes('dealer')) {
      demandGapChannel = supabase
        .channel('realtime-demand-gaps')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'demand_gap_notifications',
            filter: `dealer_id=eq.${user.id}`,
          },
          (payload) => {
            toast({
              title: '📊 New Market Opportunity',
              description: 'A new demand gap matches your inventory',
            });
          }
        )
        .subscribe();
    }


    // Cleanup
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(notificationsChannel);
      if (enquiriesChannel) supabase.removeChannel(enquiriesChannel);
      if (suggestionsChannel) supabase.removeChannel(suggestionsChannel);
      if (demandGapChannel) supabase.removeChannel(demandGapChannel);
    };
  }, [user, roles]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        unreadMessages,
        unreadNotifications,
        newLeadsCount,
        refreshUnreadCounts,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
