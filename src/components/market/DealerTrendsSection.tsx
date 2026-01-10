import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Store, Eye, MessageSquare, TrendingUp } from 'lucide-react';
import { useDealerTrends } from '@/hooks/useDealerTrends';
import { Skeleton } from '@/components/ui/skeleton';

export function DealerTrendsSection() {
  const { data: dealers, isLoading } = useDealerTrends();
  const [openDealers, setOpenDealers] = useState<Set<string>>(new Set());

  const toggleDealer = (dealerId: string) => {
    setOpenDealers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealerId)) {
        newSet.delete(dealerId);
      } else {
        newSet.add(dealerId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dealer Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Dealer Performance Trends
        </CardTitle>
        <CardDescription>Top performing dealers and their best-selling cars</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {dealers?.map((dealer) => (
            <Collapsible
              key={dealer.dealer_id}
              open={openDealers.has(dealer.dealer_id)}
              onOpenChange={() => toggleDealer(dealer.dealer_id)}
            >
              <div className="rounded-lg border hover:bg-muted/50 transition-colors">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full p-4 h-auto justify-between hover:bg-transparent"
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{dealer.dealer_name}</h4>
                          {dealer.dealer_city && (
                            <span className="text-xs text-muted-foreground">
                              • {dealer.dealer_city}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{dealer.total_views}</span>
                            <span className="text-muted-foreground">views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{dealer.total_enquiries}</span>
                            <span className="text-muted-foreground">enquiries</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{dealer.avg_response_rate.toFixed(0)}%</span>
                            <span className="text-muted-foreground">response</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {dealer.total_cars} cars
                        </Badge>
                        {openDealers.has(dealer.dealer_id) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-2 border-t">
                    <h5 className="text-sm font-semibold mb-3 text-muted-foreground">
                      Top Performing Cars
                    </h5>
                    <div className="space-y-2">
                      {dealer.top_cars.map((car, index) => (
                        <div
                          key={car.id}
                          className="flex items-center justify-between p-3 rounded-md bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium text-sm">
                                {car.brand} {car.model}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {car.variant}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{car.view_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{car.enquiry_count}</span>
                            </div>
                            <span className="text-xs font-semibold text-primary">
                              ₹{(car.price / 100000).toFixed(2)}L
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        {(!dealers || dealers.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No dealer performance data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
