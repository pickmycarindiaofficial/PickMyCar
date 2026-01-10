import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateEnquiryStatus } from '@/hooks/useEnquiries';
import { format } from 'date-fns';
import { Phone, Mail, MessageSquare, Calendar, Car } from 'lucide-react';
import { toast } from 'sonner';

interface LeadDetailsDialogProps {
  enquiryId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailsDialog({ enquiryId, open, onOpenChange }: LeadDetailsDialogProps) {
  const [status, setStatus] = useState('');
  const [dealerNotes, setDealerNotes] = useState('');
  const updateStatus = useUpdateEnquiryStatus();

  const { data: enquiry, isLoading } = useQuery({
    queryKey: ['enquiry-details', enquiryId],
    queryFn: async () => {
      if (!enquiryId) return null;

      const { data, error } = await (supabase as any)
        .from('car_enquiries')
        .select(`
          *,
          car_listing:car_listings(
            id,
            listing_id,
            brand:brands(name),
            model:models(name),
            variant,
            expected_price,
            year_of_make,
            kms_driven,
            photos,
            city:cities(name)
          ),
          user:profiles!user_id(
            id,
            full_name,
            phone_number,
            username
          )
        `)
        .eq('id', enquiryId)
        .single();

      if (error) throw error;
      return data as any;
    },
    enabled: !!enquiryId && open,
  });

  const handleUpdateStatus = () => {
    if (!enquiryId) return;

    updateStatus.mutate(
      { enquiryId, status, dealerNotes },
      {
        onSuccess: () => {
          toast.success('Lead status updated successfully');
          onOpenChange(false);
        },
        onError: () => {
          toast.error('Failed to update lead status');
        },
      }
    );
  };

  if (!enquiry && !isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">Loading...</div>
        ) : enquiry ? (
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Customer Information</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {/* @ts-ignore */}
                  <span className="font-medium">{enquiry.user?.full_name || enquiry.guest_name || 'Unknown'}</span>
                </div>
                {/* @ts-ignore */}
                {enquiry.user?.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {/* @ts-ignore */}
                    <a href={`tel:${enquiry.user.phone_number}`} className="text-primary hover:underline">
                      {/* @ts-ignore */}
                      {enquiry.user.phone_number}
                    </a>
                  </div>
                )}
                {/* @ts-ignore */}
                {enquiry.guest_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {/* @ts-ignore */}
                    <span>{enquiry.guest_email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Car Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Car Details</h3>
              <div className="flex gap-4 p-4 border rounded-lg">
                {/* @ts-ignore */}
                <img
                  src={enquiry.car_listing?.photos?.[0]?.thumbnail_url || '/placeholder.svg'}
                  alt="Car"
                  className="h-20 w-32 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-semibold">
                    {/* @ts-ignore */}
                    {enquiry.car_listing?.brand?.name} {enquiry.car_listing?.model?.name}
                  </p>
                  {/* @ts-ignore */}
                  <p className="text-sm text-muted-foreground">{enquiry.car_listing?.variant}</p>
                  <p className="text-sm">
                    {/* @ts-ignore */}
                    {enquiry.car_listing?.year_of_make} • {enquiry.car_listing?.kms_driven?.toLocaleString()} km
                  </p>
                  <p className="font-semibold text-primary">
                    {/* @ts-ignore */}
                    ₹{((enquiry.car_listing?.expected_price || 0) / 100000).toFixed(2)}L
                  </p>
                </div>
              </div>
            </div>

            {/* Enquiry Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Enquiry Information</h3>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="capitalize">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {/* @ts-ignore */}
                    {enquiry.enquiry_type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {/* @ts-ignore */}
                  <Badge className="capitalize">{enquiry.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  {/* @ts-ignore */}
                  <span>{format(new Date(enquiry.created_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                {/* @ts-ignore */}
                {enquiry.contacted_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contacted:</span>
                    {/* @ts-ignore */}
                    <span>{format(new Date(enquiry.contacted_at), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Update Status */}
            <div className="space-y-4 pt-4 border-t">
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 pb-4 border-b">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setStatus('contacted');
                    handleUpdateStatus();
                  }}
                  className="flex-1"
                >
                  ✅ Contacted
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setStatus('new');
                    setDealerNotes('Will contact soon');
                    setTimeout(handleUpdateStatus, 100);
                  }}
                  className="flex-1"
                >
                  ⏰ Contact Soon
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setStatus('converted');
                    handleUpdateStatus();
                  }}
                  className="flex-1"
                >
                  🎉 Converted
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setStatus('lost');
                    handleUpdateStatus();
                  }}
                  className="flex-1"
                >
                  ❌ Lost
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    {/* @ts-ignore */}
                    <SelectValue placeholder={`Current: ${enquiry.status}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="negotiating">Negotiating</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={dealerNotes}
                  onChange={(e) => setDealerNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={3}
                />
              </div>

              <Button onClick={handleUpdateStatus} disabled={!status} className="w-full">
                Update Lead
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
