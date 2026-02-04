import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useEventTracking } from '@/hooks/useEventTracking';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ExitRescueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

const bodyTypes = ['SUV', 'Sedan', 'Hatchback', 'MUV', 'Coupe'];
const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const budgetRanges = ['< ₹5L', '₹5-10L', '₹10-15L', '₹15-20L', '> ₹20L'];

export const ExitRescueModal = ({ open, onOpenChange, onSubmitted }: ExitRescueModalProps) => {
  const { user } = useAuth();
  const { trackEvent } = useEventTracking();
  const [selectedBodyType, setSelectedBodyType] = useState<string[]>([]);
  const [selectedFuel, setSelectedFuel] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [freeText, setFreeText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedBodyType.length && !selectedFuel.length && !selectedBudget && !freeText.trim()) {
      toast.error('Please select at least one preference or describe what you need');
      return;
    }

    setSubmitting(true);

    try {
      // Save to unmet_expectations
      // @ts-ignore - unmet_expectations table not in generated types yet
      const { error } = await (supabase as any)
        .from('unmet_expectations')
        .insert({
          user_id: user?.id || null,
          budget_max: selectedBudget ? parseFloat(selectedBudget.replace(/[^0-9.]/g, '')) * 100000 : null,
          must_haves: {
            body_types: selectedBodyType,
            fuel_types: selectedFuel,
          },
          note: freeText,
          urgency: 'warm',
          city: null,
        });

      if (error) throw error;

      // Track event
      trackEvent.mutate({
        event: 'unmet_demand_submit',
        meta: {
          body_types: selectedBodyType,
          fuel_types: selectedFuel,
          budget: selectedBudget,
          note: freeText,
        },
      });

      toast.success('Got it! We\'ll find the perfect car for you', {
        description: 'Dealers will be notified and we\'ll reach out soon',
      });

      // Mark as submitted
      localStorage.setItem('exit_modal_submitted', 'true');
      onSubmitted?.();

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving unmet demand:', error);
      // Show specific error message from Supabase or fallback
      toast.error(error?.message || error?.error_monitor || 'Failed to save your preferences. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBodyType = (type: string) => {
    setSelectedBodyType(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleFuel = (type: string) => {
    setSelectedFuel(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Not finding what you need?</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Tell us your ideal car in 10 seconds and we'll hunt it for you
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Body Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Body Type</label>
            <div className="flex flex-wrap gap-2">
              {bodyTypes.map(type => (
                <Badge
                  key={type}
                  variant={selectedBodyType.includes(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleBodyType(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Fuel Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fuel Type</label>
            <div className="flex flex-wrap gap-2">
              {fuelTypes.map(type => (
                <Badge
                  key={type}
                  variant={selectedFuel.includes(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleFuel(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Budget</label>
            <div className="flex flex-wrap gap-2">
              {budgetRanges.map(range => (
                <Badge
                  key={range}
                  variant={selectedBudget === range ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedBudget(selectedBudget === range ? '' : range)}
                >
                  {range}
                </Badge>
              ))}
            </div>
          </div>

          {/* Free Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Anything else? (Optional)</label>
            <Textarea
              placeholder="E.g., 'Need automatic SUV with sunroof, under 30k km'"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? 'Submitting...' : 'Find My Car'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
