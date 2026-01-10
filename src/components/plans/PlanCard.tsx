import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { formatCurrency } from '@/lib/razorpay';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: SubscriptionPlan;
  onSubscribe: (planId: string) => void;
  currentPlanId?: string;
  loading?: boolean;
}

export function PlanCard({ plan, onSubscribe, currentPlanId, loading }: PlanCardProps) {
  const isCurrent = currentPlanId === plan.id;
  const isPopular = plan.is_popular;

  return (
    <Card className={cn(
      "relative",
      isPopular && "border-primary shadow-lg scale-105",
      isCurrent && "border-green-500"
    )}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Most Popular
        </Badge>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl">{plan.display_name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
          <span className="text-muted-foreground">/{plan.billing_period}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Car Listings</span>
            <span className="text-primary font-bold">{plan.listing_limit}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Featured Ads</span>
            <span className="text-primary font-bold">{plan.featured_ads_limit}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Features</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        {isCurrent ? (
          <Button disabled className="w-full" variant="outline">
            Current Plan
          </Button>
        ) : (
          <Button 
            onClick={() => onSubscribe(plan.id)} 
            disabled={loading}
            className="w-full"
            variant={isPopular ? "default" : "outline"}
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
