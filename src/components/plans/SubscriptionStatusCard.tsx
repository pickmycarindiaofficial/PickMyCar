import { Calendar, Package, Star, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubscriptionInfo } from '@/hooks/useDealerSubscription';
import { format } from 'date-fns';

interface SubscriptionStatusCardProps {
  subscription: SubscriptionInfo;
}

export function SubscriptionStatusCard({ subscription }: SubscriptionStatusCardProps) {
  if (!subscription.has_active_subscription) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No active subscription. Please subscribe to a plan to start listing cars.
        </AlertDescription>
      </Alert>
    );
  }

  const listingsPercentage = subscription.listing_limit 
    ? (subscription.listings_used / subscription.listing_limit) * 100 
    : 0;
  
  const featuredPercentage = subscription.featured_limit 
    ? (subscription.featured_used / subscription.featured_limit) * 100 
    : 0;

  const isNearLimit = listingsPercentage >= 80;
  const daysRemaining = subscription.subscription_ends_at 
    ? Math.ceil((new Date(subscription.subscription_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>{subscription.plan_name}</CardDescription>
          </div>
          <Badge variant="default" className="bg-green-600">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Expiry Info */}
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Expires on:</span>
          <span className="font-medium">
            {subscription.subscription_ends_at 
              ? format(new Date(subscription.subscription_ends_at), 'dd MMM yyyy')
              : 'N/A'}
          </span>
          {daysRemaining <= 7 && (
            <Badge variant="destructive" className="ml-auto">
              {daysRemaining} days left
            </Badge>
          )}
        </div>

        {/* Listings Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>Car Listings</span>
            </div>
            <span className="font-medium">
              {subscription.listings_used} / {subscription.listing_limit}
            </span>
          </div>
          <Progress 
            value={listingsPercentage} 
            className={isNearLimit ? "bg-red-100" : ""}
          />
        </div>

        {/* Featured Ads Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span>Featured Ads</span>
            </div>
            <span className="font-medium">
              {subscription.featured_used} / {subscription.featured_limit}
            </span>
          </div>
          <Progress value={featuredPercentage} />
        </div>

        {/* Warning */}
        {isNearLimit && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You're nearing your listing limit. Consider upgrading your plan.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
