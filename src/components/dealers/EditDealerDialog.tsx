import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDealerDetails, useUpdateDealerProfile } from '@/hooks/useDealers';
import { useCities } from '@/hooks/useCities';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EditDealerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealerId: string | null;
}

export function EditDealerDialog({ open, onOpenChange, dealerId }: EditDealerDialogProps) {
  const { toast } = useToast();
  const { data: dealer, isLoading } = useDealerDetails(dealerId);
  const { data: cities } = useCities();
  const updateDealer = useUpdateDealerProfile();

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    dealership_name: '',
    business_type: '',
    gst_number: '',
    pan_number: '',
    address: '',
    city_id: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (dealer) {
      setFormData({
        full_name: dealer.full_name || '',
        phone_number: dealer.phone_number || '',
        dealership_name: dealer.dealership_name || '',
        business_type: dealer.business_type || '',
        gst_number: dealer.gst_number || '',
        pan_number: dealer.pan_number || '',
        address: dealer.address || '',
        city_id: dealer.city_id || '',
        state: dealer.state || '',
        pincode: dealer.pincode || '',
      });
    }
  }, [dealer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) return;

    try {
      await updateDealer.mutateAsync({ dealerId, data: formData });
      toast({
        title: 'Success',
        description: 'Dealer details updated successfully',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update dealer details',
        variant: 'destructive',
      });
    }
  };

  if (!dealerId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Dealer Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dealership_name">Dealership Name *</Label>
                  <Input
                    id="dealership_name"
                    value={formData.dealership_name}
                    onChange={(e) => setFormData({ ...formData, dealership_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type</Label>
                  <Select
                    value={formData.business_type}
                    onValueChange={(value) => setFormData({ ...formData, business_type: value })}
                  >
                    <SelectTrigger id="business_type">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proprietorship">Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="llp">LLP</SelectItem>
                      <SelectItem value="private_limited">Private Limited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input
                    id="gst_number"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input
                    id="pan_number"
                    value={formData.pan_number}
                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city_id">City</Label>
                    <Select
                      value={formData.city_id}
                      onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                    >
                      <SelectTrigger id="city_id">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities?.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateDealer.isPending}>
                {updateDealer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
