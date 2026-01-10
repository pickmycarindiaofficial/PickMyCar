import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Search } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  selectedId,
  onSelect,
  onNewConversation,
}: ConversationListProps) {
  const { conversations, loading } = useConversations();
  const [search, setSearch] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Conversations</CardTitle>
          <Button size="sm" onClick={onNewConversation} className="hover-scale">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover-scale ${
                selectedId === conv.id
                  ? 'bg-primary/10 border-primary shadow-sm'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={conv.participants?.[0]?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {conv.title?.charAt(0).toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {conv.title || 'Conversation'}
                    </p>
                    {conv.last_message && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(conv.last_message.sent_at), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.last_message.message_text}
                    </p>
                  )}
                </div>
                {conv.unread_count && conv.unread_count > 0 && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-primary-foreground">
                      {conv.unread_count}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
