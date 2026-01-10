import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Conversation {
  id: string;
  title: string | null;
  conversation_type: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: {
    message_text: string;
    sent_at: string;
  };
  participants?: Array<{
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  }>;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchConversations();

    // Subscribe to conversation changes
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get conversations where user is a participant
      const { data: participantData, error: participantError } = await (supabase as any)
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const conversationIds = participantData.map((p: any) => p.conversation_id);

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get conversation details
      const { data: conversationsData, error: conversationsError } = await (supabase as any)
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Get last message AND participants for each conversation
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv: any) => {
          // Fetch last message
          const { data: lastMessage } = await (supabase as any)
            .from('messages')
            .select('message_text, sent_at')
            .eq('conversation_id', conv.id)
            .eq('is_deleted', false)
            .order('sent_at', { ascending: false })
            .limit(1)
            .single();

          // Fetch participants (excluding current user for direct messages)
          const { data: participantsData } = await (supabase as any)
            .from('conversation_participants')
            .select(`
              user_id,
              profiles!inner (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id);

          // Format participants
          const participants = (participantsData || []).map((p: any) => ({
            id: p.profiles.id,
            username: p.profiles.username,
            full_name: p.profiles.full_name,
            avatar_url: p.profiles.avatar_url,
          }));

          // Generate title for direct conversations
          let title = conv.title;
          if (conv.conversation_type === 'direct' && !title && participants.length > 0) {
            const otherUser = participants[0];
            title = otherUser.full_name || otherUser.username || 'Unknown User';
          }

          return {
            ...conv,
            title,
            last_message: lastMessage,
            participants,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (participantIds: string[], title?: string) => {
    if (!user) return null;

    try {
      // For direct conversations, check if one already exists
      if (participantIds.length === 1) {
        const allParticipants = [user.id, participantIds[0]];
        
        const { data: existingConvId, error: rpcError } = await (supabase as any)
          .rpc('get_or_create_direct_conversation', {
            participant_ids: allParticipants,
          });

        if (rpcError) {
          console.error('Error checking/creating conversation:', rpcError);
          throw rpcError;
        }

        // Refresh conversations list
        await fetchConversations();
        
        return existingConvId;
      }

      // For group conversations, create new one
      const { data: conversation, error: convError } = await (supabase as any)
        .from('conversations')
        .insert({
          title,
          conversation_type: 'group',
          created_by: user.id,
        })
        .select()
        .single();

      if (convError) throw convError;
      if (!conversation) throw new Error('Failed to create conversation');

      // Add participants
      const participants = [
        { conversation_id: conversation.id, user_id: user.id },
        ...participantIds.map((id) => ({
          conversation_id: conversation.id,
          user_id: id,
        })),
      ];

      const { error: partError } = await (supabase as any)
        .from('conversation_participants')
        .insert(participants);

      if (partError) throw partError;

      // Refresh conversations list
      await fetchConversations();

      return conversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  return {
    conversations,
    loading,
    createConversation,
    refetch: fetchConversations,
  };
}
