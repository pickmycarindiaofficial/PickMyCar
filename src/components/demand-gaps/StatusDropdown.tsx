import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUpdateDemandGapStatus } from '@/hooks/useDemandGaps';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown } from 'lucide-react';

interface StatusDropdownProps {
  currentStatus: string;
  leadId: string;
  onStatusChange?: () => void;
}

const statusConfig = {
  open: { label: 'Open', color: 'bg-green-500', emoji: '🟢' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500', emoji: '🔵' },
  converted: { label: 'Converted', color: 'bg-purple-500', emoji: '✅' },
  closed: { label: 'Closed', color: 'bg-gray-500', emoji: '⛔' },
};

export function StatusDropdown({ currentStatus, leadId, onStatusChange }: StatusDropdownProps) {
  const { hasRole } = useAuth();
  const isPowerDesk = hasRole('powerdesk');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const updateStatus = useUpdateDemandGapStatus();

  const handleStatusClick = (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    // Show confirmation for converted or closed
    if (newStatus === 'converted' || newStatus === 'closed') {
      setPendingStatus(newStatus);
      setShowConfirm(true);
    } else {
      performUpdate(newStatus);
    }
  };

  const performUpdate = (status: string) => {
    updateStatus.mutate(
      { demandGapId: leadId, status },
      {
        onSuccess: () => {
          onStatusChange?.();
        },
      }
    );
  };

  const handleConfirm = () => {
    if (pendingStatus) {
      performUpdate(pendingStatus);
    }
    setShowConfirm(false);
    setPendingStatus(null);
  };

  // Define allowed statuses based on role
  const allowedStatuses = isPowerDesk
    ? ['open', 'in_progress', 'converted', 'closed']
    : ['open', 'in_progress', 'converted'];

  const currentConfig = statusConfig[currentStatus as keyof typeof statusConfig];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 hover:bg-transparent"
          >
            <Badge className={`${currentConfig.color} cursor-pointer hover:opacity-80`}>
              {currentConfig.emoji} {currentConfig.label}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {allowedStatuses.map((status) => {
            const config = statusConfig[status as keyof typeof statusConfig];
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusClick(status)}
                disabled={status === currentStatus}
                className={status === currentStatus ? 'opacity-50' : ''}
              >
                <span className="mr-2">{config.emoji}</span>
                {config.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus === 'converted' && (
                <>
                  Are you sure you want to mark this lead as <strong>converted</strong>? 
                  This indicates the customer has successfully purchased a car.
                </>
              )}
              {pendingStatus === 'closed' && (
                <>
                  Are you sure you want to <strong>close</strong> this lead? 
                  This should only be done if the lead is no longer valid or the customer is not interested.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
