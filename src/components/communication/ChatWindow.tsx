import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Paperclip, X, FileIcon } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface ChatWindowProps {
  conversationId: string | null;
  conversationTitle?: string;
}

export function ChatWindow({ conversationId, conversationTitle }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, markAsRead } = useMessages(conversationId);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markAsRead();
    }
  }, [conversationId, messages.length]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB',
          variant: 'destructive',
        });
        return;
      }
      setAttachedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `chat-attachments/${fileName}`;

    const { error } = await supabase.storage
      .from('chat_files')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('chat_files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !attachedFile) || sending) return;

    setSending(true);
    setUploading(!!attachedFile);
    
    try {
      let fileUrl = '';
      if (attachedFile) {
        fileUrl = await uploadFile(attachedFile);
      }

      const finalMessage = attachedFile 
        ? `${messageText}\n[File: ${attachedFile.name}](${fileUrl})`
        : messageText;

      await sendMessage(finalMessage);
      setMessageText('');
      setAttachedFile(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No conversation selected
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[700px]">
      <CardHeader>
        <CardTitle>{conversationTitle || 'Conversation'}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    {!isOwn && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={message.sender?.avatar_url} />
                        <AvatarFallback className="bg-muted text-xs">
                          {message.sender?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {!isOwn && message.sender && (
                        <p className="text-xs font-medium mb-1">
                          {message.sender.username}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.message_text}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {formatDistanceToNow(new Date(message.sent_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {isOwn && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {message.sender?.username?.charAt(0).toUpperCase() || 'Y'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t space-y-2">
          {attachedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{attachedFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setAttachedFile(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending || uploading}
            />
            <Button 
              onClick={handleSend} 
              disabled={sending || uploading || (!messageText.trim() && !attachedFile)}
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
