import { useState } from 'react';
import { ConversationList } from '@/components/communication/ConversationList';
import { ChatWindow } from '@/components/communication/ChatWindow';
import { NewConversationDialog } from '@/components/communication/NewConversationDialog';
import { useConversations } from '@/hooks/useConversations';
import { PermissionGate } from '@/components/common/PermissionGate';
import { toast } from 'sonner';

export default function Messages() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const { conversations, createConversation } = useConversations();

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  const handleNewConversation = () => {
    setIsNewConversationOpen(true);
  };

  const handleConversationCreated = async (userId: string) => {
    const conversationId = await createConversation([userId]);
    if (conversationId) {
      setSelectedConversationId(conversationId);
      toast.success('Conversation started');
    } else {
      toast.error('Failed to create conversation');
    }
  };

  return (
    <PermissionGate
      roles={['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection']}
      showError={true}
    >
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Messages</h1>
          <p className="text-muted-foreground text-lg">
            Internal communication hub for team collaboration
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[350px_1fr] xl:grid-cols-[400px_1fr]">
          <div className="lg:max-h-[calc(100vh-200px)]">
            <ConversationList
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
              onNewConversation={handleNewConversation}
            />
          </div>
          <div className="lg:max-h-[calc(100vh-200px)]">
            <ChatWindow
              conversationId={selectedConversationId}
              conversationTitle={selectedConversation?.title || undefined}
            />
          </div>
        </div>

        <NewConversationDialog
          open={isNewConversationOpen}
          onOpenChange={setIsNewConversationOpen}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </PermissionGate>
  );
}
