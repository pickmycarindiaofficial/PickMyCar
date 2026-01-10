import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useDealerSubscription, useActivateSubscription } from '@/hooks/useDealerSubscription';
import { PlanCard } from '@/components/plans/PlanCard';
import { SubscriptionStatusCard } from '@/components/plans/SubscriptionStatusCard';
import { initiateRazorpayPayment } from '@/lib/razorpay';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Plans() {
  const { user, profile } = useAuth();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: subscription, isLoading: subLoading } = useDealerSubscription();
  const activateSubscription = useActivateSubscription();
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = async (planId: string) => {
    const selectedPlan = plans?.find(p => p.id === planId);
    if (!selectedPlan || !user || !profile) return;

    setProcessing(true);

    try {
      // For demo purposes, we'll create a test payment
      // In production, you'd call your edge function to create a Razorpay order
      const RAZORPAY_KEY = 'rzp_test_YOUR_KEY_HERE'; // Replace with actual key

      await initiateRazorpayPayment({
        key: RAZORPAY_KEY,
        amount: selectedPlan.price * 100, // Razorpay expects paise
        currency: selectedPlan.currency,
        name: 'PickMyCar Subscription',
        description: `${selectedPlan.display_name} - Monthly Subscription`,
        prefill: {
          name: profile.full_name,
          email: user.email || '',
          contact: profile.phone_number || '',
        },
        theme: {
          color: '#5048e5',
        },
        handler: async (response: any) => {
          // Payment successful
          try {
            await activateSubscription.mutateAsync({
              dealer_id: user.id,
              plan_id: planId,
              duration_months: 1,
              payment_method: 'razorpay',
              razorpay_payment_id: response.razorpay_payment_id,
              amount_paid: selectedPlan.price,
            });
            
            toast.success('🎉 Subscription activated! You can now list cars.');
          } catch (error) {
            toast.error('Payment received but activation failed. Contact support.');
            console.error(error);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast.info('Payment cancelled');
          },
        },
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  if (plansLoading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground mt-2">
          Choose the perfect plan for your dealership
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <SubscriptionStatusCard subscription={subscription} />
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSubscribe={handleSubscribe}
            loading={processing}
          />
        ))}
      </div>

      {/* Test Mode Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Test Mode:</strong> This is using test Razorpay credentials. 
          Use test card: 4111 1111 1111 1111, any future expiry date, any CVV.
        </p>
      </div>
    </div>
  );
}
