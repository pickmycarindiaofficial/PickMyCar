import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSuspendDealer, useDealerDetails } from '@/hooks/useDealers';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

interface SuspendDealerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealerId: string | null;
}

export function SuspendDealerDialog({ open, onOpenChange, dealerId }: SuspendDealerDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const { data: dealer } = useDealerDetails(dealerId);
  const suspendDealer = useSuspendDealer();

  const handleSuspend = async () => {
    if (!dealerId) return;

    if (!reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for suspension',
        variant: 'destructive',
      });
      return;
    }

    try {
      await suspendDealer.mutateAsync({ dealerId, reason: reason.trim() });
      toast({
        title: 'Success',
        description: 'Dealer account suspended successfully',
      });
      setReason('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend dealer account',
        variant: 'destructive',
      });
    }
  };

  if (!dealerId) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Suspend Dealer Account</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            You are about to suspend the account for <strong>{dealer?.full_name}</strong> ({dealer?.dealership_name}).
            This action will:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Deactivate the dealer's account</li>
            <li>Prevent them from logging in</li>
            <li>Hide all their active listings</li>
            <li>This action can be reversed later</li>
          </ul>

          <div className="space-y-2">
            <Label htmlFor="reason">Suspension Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for suspending this dealer account..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={suspendDealer.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSuspend}
            disabled={suspendDealer.isPending || !reason.trim()}
          >
            {suspendDealer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Suspend Account
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
