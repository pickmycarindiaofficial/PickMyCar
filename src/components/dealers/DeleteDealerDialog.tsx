import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useDeleteDealer, useDealerDetails } from '@/hooks/useDealers';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteDealerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dealerId: string | null;
}

export function DeleteDealerDialog({ open, onOpenChange, dealerId }: DeleteDealerDialogProps) {
    const { toast } = useToast();
    const { data: dealer } = useDealerDetails(dealerId);
    const deleteDealer = useDeleteDealer();

    const handleDelete = async () => {
        if (!dealerId) return;

        try {
            await deleteDealer.mutateAsync(dealerId);
            toast({
                title: 'Success',
                description: 'Dealer account deleted permanently',
            });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete dealer account',
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
                        <Trash2 className="h-5 w-5 text-destructive" />
                        <AlertDialogTitle>Delete Dealer Permanently?</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        You are about to permanently delete the account for <strong>{dealer?.full_name}</strong> ({dealer?.dealership_name}).
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="bg-destructive/10 p-4 rounded-md border border-destructive/20 text-destructive text-sm">
                    <p className="font-semibold mb-2">Warning: This action cannot be undone.</p>
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                        <li>Dealer account will be permanently removed</li>
                        <li>All listings, photos, and messages will be lost</li>
                        <li>Profile and subscription data will be deleted</li>
                    </ul>
                </div>

                <AlertDialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteDealer.isPending}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteDealer.isPending}
                    >
                        {deleteDealer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Permanently
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
