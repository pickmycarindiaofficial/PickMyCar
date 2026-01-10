import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserBehaviorDrawer } from '@/hooks/useUserBehaviorDrawer';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Eye, Phone, MessageCircle, Calculator, Target, TrendingUp, 
  Lightbulb, Car, DollarSign, Percent, Clock, ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserBehaviorDrawerProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

export function UserBehaviorDrawer({ userId, open, onClose }: UserBehaviorDrawerProps) {
  const { data, isLoading } = useUserBehaviorDrawer(userId || undefined);

  // Generate intelligent AI suggestions based on user behavior
  const generateAISuggestions = () => {
    if (!data) return [];

    const suggestions = [];
    const topBrand = data.brandAffinity[0]?.brand;
    const topModel = data.modelAffinity[0]?.model;
    const mostViewedCar = data.carViews[0];
    const { contactActivity, emiEngagement } = data;

    // User type classification
    let userType = 'Browser';
    let closeProbability = 25;
    
    if (emiEngagement.calculations_count > 3 && contactActivity.total_contacts > 2) {
      userType = 'Hot Lead - Ready to Buy';
      closeProbability = 85;
    } else if (emiEngagement.calculations_count > 0 && contactActivity.total_contacts > 0) {
      userType = 'Warm Lead - Seriously Considering';
      closeProbability = 60;
    } else if (data.carViews.length > 5) {
      userType = 'Active Researcher';
      closeProbability = 35;
    }

    suggestions.push({
      type: 'user_profile',
      title: `User Type: ${userType}`,
      content: `Close Probability: ${closeProbability}% • ${data.carViews.length} cars viewed • ${contactActivity.total_contacts} contacts made`,
      priority: closeProbability > 60 ? 'high' : closeProbability > 40 ? 'medium' : 'low'
    });

    if (mostViewedCar) {
      suggestions.push({
        type: 'pitch_strategy',
        title: '🎯 Lead with This Car',
        content: `${mostViewedCar.car_name} (₹${(mostViewedCar.price / 100000).toFixed(2)}L) - Viewed ${mostViewedCar.view_count}x${mostViewedCar.emi_calculated ? ', EMI calculated' : ''}${mostViewedCar.contacted ? ', Already contacted you!' : ''}`,
        priority: mostViewedCar.contacted ? 'high' : 'medium'
      });
    }

    if (emiEngagement.calculations_count > 0) {
      const topEMICar = emiEngagement.cars_with_emi[0];
      suggestions.push({
        type: 'finance',
        title: '💰 Finance Interest Detected',
        content: `${emiEngagement.calculations_count} EMI calculations done. Top: ${topEMICar?.car_name} (calculated ${topEMICar?.times_calculated}x). Offer pre-approved loan options.`,
        priority: 'high'
      });
    }

    if (topBrand) {
      suggestions.push({
        type: 'inventory',
        title: `🚗 Preference: ${topBrand}${topModel ? ` ${topModel}` : ''}`,
        content: `Show all ${topBrand} variants in stock, especially ${topModel || 'similar models'}. Highlight value propositions.`,
        priority: 'medium'
      });
    }

    if (data.brandAffinity.length > 1) {
      const altBrands = data.brandAffinity.slice(1, 3).map(b => b.brand).join(', ');
      suggestions.push({
        type: 'alternatives',
        title: '📋 Alternative Options',
        content: `Also interested in: ${altBrands}. Suggest comparable models from your inventory as backup options.`,
        priority: 'low'
      });
    }

    return suggestions;
  };

  const aiSuggestions = data ? generateAISuggestions() : [];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>User Behavior Analysis</SheetTitle>
          <p className="text-sm text-muted-foreground">Last 30 days activity • AI-powered insights</p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {!isLoading && !data && (
            <div className="py-12 text-center text-muted-foreground">No data available</div>
          )}

          {!isLoading && data && (
            <div className="space-y-4 pr-4">
              {/* AI Suggestions */}
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    AI Sales Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {aiSuggestions.map((suggestion, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${
                      suggestion.priority === 'high' ? 'bg-destructive/10 border border-destructive/20' : 
                      suggestion.priority === 'medium' ? 'bg-primary/10 border border-primary/20' : 'bg-muted'
                    }`}>
                      <div className="flex items-start gap-2">
                        <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {suggestion.priority}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-2">
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <Eye className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-xl font-bold">{data.carViews.length}</p>
                    <p className="text-xs text-muted-foreground">Cars Viewed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <MessageCircle className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-xl font-bold">{data.contactActivity.whatsapp_clicks}</p>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <Phone className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                    <p className="text-xl font-bold">{data.contactActivity.call_clicks}</p>
                    <p className="text-xs text-muted-foreground">Calls</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <Calculator className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                    <p className="text-xl font-bold">{data.emiEngagement.calculations_count}</p>
                    <p className="text-xs text-muted-foreground">EMI Calcs</p>
                  </CardContent>
                </Card>
              </div>

              {/* Cars Viewed */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Cars Viewed This Month
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Top {data.carViews.length} most viewed • Last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.carViews.slice(0, 10).map((car) => (
                      <div key={car.car_id} className="p-3 rounded-lg bg-muted/50 border border-border">
                        {/* Header: Brand, Model, View Count */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs font-semibold">
                                {car.brand}
                              </Badge>
                              <span className="text-sm font-medium">{car.model}</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-semibold text-primary">
                                ₹{(car.price / 100000).toFixed(2)}L
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Viewed {car.view_count}x
                              </span>
                            </div>
                          </div>
                          
                          {/* EMI Badge */}
                          {car.emi_calculated && (
                            <Badge variant="default" className="text-xs bg-purple-500">
                              <Calculator className="h-3 w-3 mr-1" />
                              EMI
                            </Badge>
                          )}
                        </div>

                        {/* Dealer Info */}
                        <div className="flex items-center justify-between py-2 border-y my-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Dealer:</span>
                            <span className="text-xs font-semibold">{car.dealer_name}</span>
                          </div>
                          
                          {/* Contact Status Badges */}
                          {car.contacted && (
                            <div className="flex gap-1">
                              {car.contacted_via_whatsapp && (
                                <Badge variant="default" className="text-xs bg-green-500 gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  Contacted
                                </Badge>
                              )}
                              {car.contacted_via_call && (
                                <Badge variant="default" className="text-xs bg-orange-500 gap-1">
                                  <Phone className="h-3 w-3" />
                                  Contacted
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Last Viewed + Action Buttons */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Last viewed: {formatDistanceToNow(new Date(car.last_viewed), { addSuffix: true })}
                          </div>
                          
                          <div className="flex gap-1">
                            {/* WhatsApp Button */}
                            {car.dealer_whatsapp && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800"
                                onClick={() => {
                                  const message = encodeURIComponent(
                                    `Hi! I'm interested in the ${car.car_name} (₹${(car.price / 100000).toFixed(2)}L) that the user viewed ${car.view_count} times.`
                                  );
                                  window.open(`https://wa.me/${car.dealer_whatsapp}?text=${message}`, '_blank');
                                }}
                              >
                                <MessageCircle className="h-3 w-3 mr-1 text-green-600 dark:text-green-400" />
                                WhatsApp
                              </Button>
                            )}
                            
                            {/* Call Button */}
                            {car.dealer_phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs bg-orange-50 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:border-orange-800"
                                onClick={() => {
                                  window.location.href = `tel:${car.dealer_phone}`;
                                }}
                              >
                                <Phone className="h-3 w-3 mr-1 text-orange-600 dark:text-orange-400" />
                                Call
                              </Button>
                            )}
                            
                            {/* View Car Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                window.open(`/car/${car.car_id}`, '_blank');
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dealers Contacted */}
              {data.contactActivity.dealers_contacted.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Dealers Contacted
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {data.contactActivity.total_contacts} total contacts • Last 30 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.contactActivity.dealers_contacted.map((dealer, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/50 border border-border">
                          {/* Dealer Header */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">{dealer.dealer_name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {dealer.total_count} contacts
                            </Badge>
                          </div>
                          
                          {/* Contact Type Breakdown */}
                          <div className="flex gap-2 mb-3">
                            {dealer.whatsapp_count > 0 && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-100 dark:bg-green-900/20">
                                <MessageCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                  {dealer.whatsapp_count} WhatsApp
                                </span>
                              </div>
                            )}
                            {dealer.call_count > 0 && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/20">
                                <Phone className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                  {dealer.call_count} Calls
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Individual Contact Logs (Show last 3) */}
                          {dealer.contacts && dealer.contacts.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Recent Contacts:
                              </p>
                              {dealer.contacts.slice(0, 3).map((contact, cidx) => (
                                <div key={cidx} className="flex items-center gap-2 text-xs">
                                  {contact.type === 'whatsapp' ? (
                                    <MessageCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <Phone className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                  )}
                                  <span className="flex-1 truncate text-muted-foreground">
                                    {contact.car_name}
                                  </span>
                                  <span className="text-muted-foreground whitespace-nowrap">
                                    {format(new Date(contact.timestamp), 'MMM dd, HH:mm')}
                                  </span>
                                </div>
                              ))}
                              {dealer.contacts.length > 3 && (
                                <p className="text-xs text-muted-foreground italic mt-1">
                                  + {dealer.contacts.length - 3} more contacts
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* EMI Details */}
              {data.emiEngagement.cars_with_emi.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Loan Interest
                    </CardTitle>
                    <CardDescription className="text-xs">Loan Probability: {data.emiEngagement.loan_probability}%</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.emiEngagement.cars_with_emi.map((car, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{car.car_name}</p>
                            <p className="text-xs text-muted-foreground">₹{(car.price / 100000).toFixed(2)}L</p>
                          </div>
                          <Badge variant="outline">{car.times_calculated}x calculated</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Brand & Price Preferences */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Top Brands
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.brandAffinity.slice(0, 3).map((brand) => (
                        <div key={brand.brand} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{brand.brand}</span>
                            <span className="text-muted-foreground">{brand.percentage.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${brand.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Percent className="h-3 w-3" />
                      Price Range
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.priceSensitivity.map((range) => (
                        <div key={range.range} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{range.range}</span>
                            <span className="text-muted-foreground">{range.percentage.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-chart-2 rounded-full" style={{ width: `${range.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
