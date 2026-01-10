import { useState } from 'react';
import { Search, Users, Store, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStaffMembers } from '@/hooks/useStaffMembers';
import { useDealersList } from '@/hooks/useDealersList';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/types/auth';
import { Skeleton } from '@/components/ui/skeleton';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onConversationCreated,
}: NewConversationDialogProps) {
  const { hasRole, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('team');
  
  // Pass current user ID to exclude them from lists
  const { staffMembers, loading: staffLoading, error: staffError } = useStaffMembers(user?.id);
  const { dealers, loading: dealersLoading, error: dealersError } = useDealersList(user?.id);

  const isPowerDesk = hasRole('powerdesk');

  // Filter staff members by search query
  const filteredStaff = staffMembers.filter(
    (staff) =>
      staff.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter dealers by search query
  const filteredDealers = dealers.filter(
    (dealer) =>
      dealer.dealership_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (userId: string) => {
    onConversationCreated(userId);
    onOpenChange(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            New Conversation
          </DialogTitle>
          <DialogDescription>
            Start a new conversation with team members or dealers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members
              </TabsTrigger>
              {isPowerDesk && (
                <TabsTrigger value="dealers" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Dealers
                </TabsTrigger>
              )}
            </TabsList>

            {/* Team Members Tab */}
            <TabsContent value="team" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {staffLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : staffError ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-destructive opacity-50" />
                    <p className="text-destructive font-medium mt-4">
                      Failed to load team members
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Make sure you have run <code className="bg-muted px-2 py-1 rounded text-xs">messaging_system_setup.sql</code>
                    </p>
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>
                      {staffMembers.length === 0 
                        ? "No team members found"
                        : searchQuery 
                        ? "No team members match your search"
                        : "No other team members available"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStaff.map((staff) => (
                      <button
                        key={staff.id}
                        onClick={() => handleSelectUser(staff.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={staff.avatar_url || ''} />
                          <AvatarFallback>
                            {staff.full_name?.charAt(0) || staff.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {staff.full_name || staff.username}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {ROLE_LABELS[staff.role]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {staff.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Dealers Tab (PowerDesk Only) */}
            {isPowerDesk && (
              <TabsContent value="dealers" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {dealersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : dealersError ? (
                    <div className="text-center py-12">
                      <Store className="h-12 w-12 mx-auto text-destructive opacity-50" />
                      <p className="text-destructive font-medium mt-4">
                        Failed to load dealers
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Make sure you have run <code className="bg-muted px-2 py-1 rounded text-xs">messaging_system_setup.sql</code>
                      </p>
                    </div>
                  ) : filteredDealers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>
                        {dealers.length === 0 
                          ? "No dealers found"
                          : searchQuery 
                          ? "No dealers match your search"
                          : "No other dealers available"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredDealers.map((dealer) => (
                        <button
                          key={dealer.id}
                          onClick={() => handleSelectUser(dealer.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={dealer.logo_url || dealer.avatar_url || ''} />
                            <AvatarFallback>
                              {dealer.dealership_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {dealer.dealership_name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="truncate">{dealer.city_name || 'Unknown City'}</span>
                              {dealer.total_listings > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{dealer.total_listings} listings</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
