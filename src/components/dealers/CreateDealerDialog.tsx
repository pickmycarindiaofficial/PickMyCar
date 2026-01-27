import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useCities } from '@/hooks/useCities';
import { useCreateDealer } from '@/hooks/useDealers';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateDealerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDealerDialog({ open, onOpenChange }: CreateDealerDialogProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    dealership_name: '',
    owner_name: '',
    email: '',
    phone_number: '',
    username: '',
    business_type: '',
    gst_number: '',
    pan_number: '',
    address: '',
    city_id: '',
    state: '',
    pincode: '',
    plan_id: '',
  });

  const { data: plans } = useSubscriptionPlans();
  const { data: cities } = useCities();
  const { mutate: createDealer, isPending } = useCreateDealer();

  const handleSubmit = () => {
    if (!formData.dealership_name || !formData.owner_name || !formData.phone_number || !formData.username || !formData.plan_id || !formData.city_id) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    createDealer(formData, {
      onSuccess: (result) => {
        toast({
          title: 'Dealer Created Successfully!',
          description: `Username: ${formData.username}. Dealer can login at /dealer/login with WhatsApp OTP.`,
        });
        onOpenChange(false);
        setStep(1);
        setFormData({
          dealership_name: '',
          owner_name: '',
          email: '',
          phone_number: '',
          username: '',
          business_type: '',
          gst_number: '',
          pan_number: '',
          address: '',
          city_id: '',
          state: '',
          pincode: '',
          plan_id: '',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create dealer account',
          variant: 'destructive',
        });
      },
    });
  };


  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dealership_name">Dealership Name *</Label>
              <Input
                id="dealership_name"
                value={formData.dealership_name}
                onChange={(e) => setFormData({ ...formData, dealership_name: e.target.value })}
                placeholder="ABC Motors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name">Owner Name *</Label>
              <Input
                id="owner_name"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="dealer@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="dealer123"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Dealer will login with this username + WhatsApp OTP (no password needed)
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type</Label>
              <Input
                id="business_type"
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                placeholder="Proprietorship, Partnership, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan_number">PAN Number</Label>
              <Input
                id="pan_number"
                value={formData.pan_number}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                placeholder="ABCDE1234F"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city_id">City *</Label>
                <Select value={formData.city_id} onValueChange={(value) => setFormData({ ...formData, city_id: value })}>
                  <SelectTrigger>
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
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="110001"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan_id">Subscription Plan *</Label>
              <Select value={formData.plan_id} onValueChange={(value) => setFormData({ ...formData, plan_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.display_name} - ₹{plan.price}/{plan.billing_period} ({plan.listing_limit} listings)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Summary</h4>
              <div className="text-sm space-y-1">
                <p><strong>Dealership:</strong> {formData.dealership_name}</p>
                <p><strong>Owner:</strong> {formData.owner_name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Phone:</strong> {formData.phone_number}</p>
                <p><strong>Username:</strong> {formData.username}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Dealer Account</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? 'Basic Information' : step === 2 ? 'Business Details' : 'Plan Assignment'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderStep()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : step === 3 ? (
              'Create Account'
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
