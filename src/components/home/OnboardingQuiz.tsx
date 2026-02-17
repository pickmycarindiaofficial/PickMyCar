import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Flame, Calendar, Eye, Wallet, CreditCard, Building2, HelpCircle, Car } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { generateUUID } from '@/lib/utils';

interface OnboardingQuizProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const STEPS = {
  INTENT: 'intent',
  BUDGET: 'budget',
  BUYING_MODE: 'buying_mode',
  BRANDS: 'brands',
};

export const OnboardingQuiz = ({ open, onOpenChange, onComplete }: OnboardingQuizProps) => {
  const { user } = useAuth();
  const { requestLocation } = useGeolocation();
  const [currentStep, setCurrentStep] = useState(STEPS.INTENT);

  // Answers
  const [intent, setIntent] = useState<string>('');
  const [budgetBand, setBudgetBand] = useState<string>('');
  const [buyingMode, setBuyingMode] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const intentOptions = [
    {
      value: 'hot',
      label: 'Immediately / This week',
      icon: Flame,
      description: 'Ready to buy now',
      color: 'text-orange-600'
    },
    {
      value: 'warm',
      label: 'Within 30 days',
      icon: Calendar,
      description: 'Actively looking',
      color: 'text-yellow-600'
    },
    {
      value: 'cold',
      label: 'Just exploring for now',
      icon: Eye,
      description: 'No immediate plans',
      color: 'text-blue-600'
    },
  ];

  const budgetOptions = [
    '₹1 – 5 L',
    '₹5 – 10 L',
    '₹10 – 20 L',
    '₹20 – 50 L',
    '₹50 L +',
  ];

  const buyingOptions = [
    {
      value: 'cash',
      label: 'Cash Purchase',
      icon: Wallet,
      description: 'Pay full amount upfront',
      color: 'text-green-600'
    },
    {
      value: 'loan',
      label: 'Loan / Finance Required',
      icon: Building2,
      description: 'Need financing options',
      color: 'text-blue-600'
    },
    {
      value: 'undecided',
      label: 'Not decided yet',
      icon: HelpCircle,
      description: 'Exploring both options',
      color: 'text-gray-600'
    },
  ];

  const popularBrands = [
    'Maruti Suzuki',
    'Hyundai',
    'Tata',
    'Kia',
    'Honda',
    'Toyota',
    'Mahindra',
    'Renault',
    'Nissan',
    'Ford',
  ];

  const premiumBrands = [
    'BMW',
    'Mercedes-Benz',
    'Audi',
    'Volvo',
    'Lexus',
    'Jaguar',
    'Land Rover',
    'Porsche',
  ];

  const handleSubmit = async () => {
    try {
      // Validate user is logged in
      if (!user?.id) {
        // Save preferences locally for non-logged-in users
        const localPrefs = {
          intent,
          budget_band: budgetBand,
          buying_mode: buyingMode,
          preferred_brands: selectedBrands.length > 0 ? selectedBrands : null,
          saved_at: new Date().toISOString(),
        };
        localStorage.setItem('user_preferences', JSON.stringify(localPrefs));
        localStorage.setItem('onboarding_complete', 'true');

        toast.success('Preferences saved! Sign in to sync across devices.');
        onComplete();
        onOpenChange(false);
        return;
      }

      // Save to user_profile table
      const { error: profileError } = await supabase
        .from('user_profile')
        .upsert({
          user_id: user.id,
          intent,
          budget_band: budgetBand,
          buying_mode: buyingMode,
          preferred_brands: selectedBrands.length > 0 ? selectedBrands : null,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error('Failed to save user profile:', profileError);
        throw profileError;
      }

      // Track quiz completion event (non-blocking)
      const sessionId = localStorage.getItem('session_id') || generateUUID();
      if (!localStorage.getItem('session_id')) {
        localStorage.setItem('session_id', sessionId);
      }

      // Fire and forget - don't block on event tracking
      supabase
        .from('user_events')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          event: 'onboarding_complete',
          meta: {
            intent,
            budget_band: budgetBand,
            buying_mode: buyingMode,
            brands_selected: selectedBrands.length,
          }
        })
        .then(({ error }) => {
          if (error) console.warn('Event tracking failed:', error);
        });

      // Mark onboarding as complete
      localStorage.setItem('onboarding_complete', 'true');

      // Request location permission after quiz (non-blocking)
      requestLocation().catch(() => {
        // Silent fail - location is optional
      });

      toast.success('Profile saved! Personalizing your experience...');
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Preference save error:', error);

      // Provide more specific error messages
      if (error?.code === '42501') {
        toast.error('Permission denied. Please try signing in again.');
      } else if (error?.code === '23505') {
        toast.error('Profile already exists. Refreshing...');
        onComplete();
        onOpenChange(false);
      } else if (error?.message?.includes('network')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to save preferences. Please try again.');
      }
    }
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleNoPreference = () => {
    if (selectedBrands.length === 0 || selectedBrands.includes('No Preference')) {
      setSelectedBrands([]);
    } else {
      setSelectedBrands(['No Preference']);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case STEPS.INTENT: return !!intent;
      case STEPS.BUDGET: return !!budgetBand;
      case STEPS.BUYING_MODE: return !!buyingMode;
      case STEPS.BRANDS: return true; // Optional step
      default: return false;
    }
  };

  const nextStep = () => {
    const steps = Object.values(STEPS);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    const steps = Object.values(STEPS);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.INTENT:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                🧭 When do you plan to buy your next car?
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                This helps us prioritize the right cars for you
              </p>
            </DialogHeader>
            <RadioGroup value={intent} onValueChange={setIntent} className="space-y-3 py-6">
              {intentOptions.map(option => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${intent === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                    }`}
                  onClick={() => {
                    if (option.value === 'cold') {
                      localStorage.setItem('onboarding_complete', 'true');
                      toast.info('Enjoy exploring! Filter cars anytime.');
                      onOpenChange(false);
                    } else {
                      setIntent(option.value);
                    }
                  }}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </>
        );

      case STEPS.BUDGET:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
                💰 What's your approximate budget?
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                We'll show you cars within your price range
              </p>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3 py-6">
              {budgetOptions.map(option => (
                <Button
                  key={option}
                  variant={budgetBand === option ? 'default' : 'outline'}
                  className="h-auto py-4 text-base font-medium"
                  onClick={() => setBudgetBand(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </>
        );

      case STEPS.BUYING_MODE:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                🏦 How do you plan to buy?
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                This helps us suggest the right payment options
              </p>
            </DialogHeader>
            <div className="space-y-3 py-6">
              {buyingOptions.map(option => (
                <button
                  key={option.value}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${buyingMode === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                    }`}
                  onClick={() => setBuyingMode(option.value)}
                >
                  <option.icon className={`w-6 h-6 ${option.color}`} />
                  <div className="flex-1">
                    <div className="font-medium text-base">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                  {buyingMode === option.value && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        );

      case STEPS.BRANDS:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
                🚘 Which brands do you prefer?
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Select all that apply (or skip this step)
              </p>
            </DialogHeader>
            <div className="space-y-6 py-6">
              {/* No Preference Option */}
              <div className="flex justify-center">
                <Badge
                  variant={selectedBrands.includes('No Preference') || selectedBrands.length === 0 ? 'default' : 'outline'}
                  className="cursor-pointer text-sm py-2 px-4"
                  onClick={toggleNoPreference}
                >
                  No Preference
                </Badge>
              </div>

              {/* Popular Brands */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">Popular Brands</div>
                <div className="flex flex-wrap gap-2">
                  {popularBrands.map(brand => (
                    <Badge
                      key={brand}
                      variant={selectedBrands.includes(brand) ? 'default' : 'outline'}
                      className="cursor-pointer text-sm py-2 px-3"
                      onClick={() => toggleBrand(brand)}
                    >
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Premium Brands */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">Premium Brands</div>
                <div className="flex flex-wrap gap-2">
                  {premiumBrands.map(brand => (
                    <Badge
                      key={brand}
                      variant={selectedBrands.includes(brand) ? 'default' : 'outline'}
                      className="cursor-pointer text-sm py-2 px-3"
                      onClick={() => toggleBrand(brand)}
                    >
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  const steps = Object.values(STEPS);
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicator */}
        <div className="text-center text-sm text-muted-foreground mb-4">
          Step {currentStepIndex + 1} of {steps.length}
        </div>

        {renderStep()}

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t">
          {currentStepIndex > 0 && (
            <Button variant="outline" onClick={prevStep} className="flex-1">
              ← Back
            </Button>
          )}
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex-1"
          >
            {currentStepIndex === steps.length - 1 ? 'Complete Setup' : 'Next →'}
          </Button>
        </div>

        {/* Skip option */}
        <button
          className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center w-full mt-2"
          onClick={() => {
            localStorage.setItem('onboarding_complete', 'true');
            toast.info('You can always set preferences from your profile');
            onOpenChange(false);
          }}
        >
          Skip for now
        </button>
      </DialogContent>
    </Dialog>
  );
};
