import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLoanApplication } from '@/hooks/useLoanApplication';
import { useCities } from '@/hooks/useCities';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface QuickLoanApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carListingId: string;
  carBrand: string;
  carModel: string;
  carVariant: string;
  carPrice: number;
}

export function QuickLoanApplicationDialog({
  open,
  onOpenChange,
  carListingId,
  carBrand,
  carModel,
  carVariant,
  carPrice,
}: QuickLoanApplicationDialogProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    cityId: '',
    monthlyIncome: '',
    existingLoans: false,
    employmentType: 'salaried',
  });

  const { createApplication, isLoading } = useLoanApplication();
  const { data: cities } = useCities();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createApplication.mutateAsync({
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      email: formData.email || undefined,
      cityId: formData.cityId || undefined,
      carListingId,
      carBrand,
      carModel,
      carVariant,
      carPrice,
      monthlyIncome: parseFloat(formData.monthlyIncome),
      existingLoans: formData.existingLoans,
      employmentType: formData.employmentType,
    });

    setStep('success');
  };

  const handleClose = () => {
    setStep('form');
    setFormData({
      fullName: '',
      phoneNumber: '',
      email: '',
      cityId: '',
      monthlyIncome: '',
      existingLoans: false,
      employmentType: 'salaried',
    });
    onOpenChange(false);
  };

  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Application Submitted!</h3>
            <p className="text-muted-foreground mb-6">
              Our finance partner will verify within working hours and send you a secure link to upload your KYC documents.
            </p>
            
            <div className="w-full bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold mb-2">Car Details:</h4>
              <p className="text-sm text-muted-foreground">
                {carBrand} {carModel} - {carVariant}
              </p>
              <p className="text-lg font-bold mt-2">
                ₹{carPrice.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="w-full bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-left mb-6">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Next Steps:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>✓ We'll verify your information</li>
                <li>✓ You'll receive a secure document upload link</li>
                <li>✓ Upload Aadhaar, PAN, and Salary proof</li>
                <li>✓ Get loan approval within 24-48 hours</li>
              </ul>
            </div>

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Car Loan</DialogTitle>
          <DialogDescription>
            Quick application - takes only 2 minutes. We'll verify and send you a document upload link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="10-digit mobile number"
              required
              pattern="[0-9]{10}"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cityId">City</Label>
            <Select
              value={formData.cityId}
              onValueChange={(value) => setFormData({ ...formData, cityId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your city" />
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
            <Label htmlFor="monthlyIncome">Monthly Income *</Label>
            <Input
              id="monthlyIncome"
              type="number"
              value={formData.monthlyIncome}
              onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
              placeholder="Enter monthly income"
              required
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment Type *</Label>
            <Select
              value={formData.employmentType}
              onValueChange={(value) => setFormData({ ...formData, employmentType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salaried">Salaried</SelectItem>
                <SelectItem value="self_employed">Self Employed</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="existingLoans" className="cursor-pointer">
              Do you have existing loans?
            </Label>
            <Switch
              id="existingLoans"
              checked={formData.existingLoans}
              onCheckedChange={(checked) => setFormData({ ...formData, existingLoans: checked })}
            />
          </div>

          <div className="pt-4 space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
