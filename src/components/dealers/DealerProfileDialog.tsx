import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDealerDetails } from '@/hooks/useDealers';
import { Building2, User, FileText, CreditCard, Car, Edit, Phone, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface DealerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealerId: string | null;
  onEdit?: () => void;
}

export function DealerProfileDialog({ open, onOpenChange, dealerId, onEdit }: DealerProfileDialogProps) {
  const { data: dealer, isLoading } = useDealerDetails(dealerId);

  if (!dealerId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Dealer Profile</DialogTitle>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-20 bg-muted animate-pulse rounded" />
            <div className="h-40 bg-muted animate-pulse rounded" />
          </div>
        ) : dealer ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{dealer.full_name}</h3>
                    <p className="text-muted-foreground">@{dealer.username}</p>
                    <Badge variant={dealer.is_active ? 'default' : 'secondary'} className="mt-2">
                      {dealer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">Email</span>
                    </div>
                    <p className="font-medium">{dealer.email || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2 p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">Phone</span>
                    </div>
                    <p className="font-medium">{dealer.phone_number || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Dealership Information</h4>
                  </div>
                  <Separator className="mb-3" />
                  <div className="grid gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Dealership Name:</span>
                      <span className="col-span-2 font-medium">{dealer.dealership_name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Business Type:</span>
                      <span className="col-span-2 font-medium">{dealer.business_type || 'Not specified'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">GST Number:</span>
                      <span className="col-span-2 font-medium">{dealer.gst_number || 'Not provided'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">PAN Number:</span>
                      <span className="col-span-2 font-medium">{dealer.pan_number || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Location</h4>
                  </div>
                  <Separator className="mb-3" />
                  <div className="grid gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="col-span-2 font-medium">{dealer.address}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">City:</span>
                      <span className="col-span-2 font-medium">{dealer.city_name || 'Not specified'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">State:</span>
                      <span className="col-span-2 font-medium">{dealer.state}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Pincode:</span>
                      <span className="col-span-2 font-medium">{dealer.pincode}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Subscription Details</h4>
                </div>
                <Separator className="mb-3" />
                {dealer.subscription ? (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="col-span-2 font-medium">{dealer.subscription.plan_name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="col-span-2">
                        <Badge variant={dealer.subscription.is_active ? 'default' : 'secondary'}>
                          {dealer.subscription.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Listings:</span>
                      <span className="col-span-2 font-medium">
                        {dealer.subscription.listings_remaining} / {dealer.subscription.listing_limit}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Featured Ads:</span>
                      <span className="col-span-2 font-medium">
                        {dealer.subscription.featured_ads_remaining} / {dealer.subscription.featured_ads_limit}
                      </span>
                    </div>
                    {dealer.subscription.ends_at && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Expires On:</span>
                        <span className="col-span-2 font-medium">
                          {format(new Date(dealer.subscription.ends_at), 'PPP')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active subscription</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Documents</h4>
                </div>
                <Separator className="mb-3" />
                <div className="grid gap-3">
                  {dealer.gst_certificate_url && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>GST Certificate</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href={dealer.gst_certificate_url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    </div>
                  )}
                  {dealer.pan_card_url && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>PAN Card</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href={dealer.pan_card_url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    </div>
                  )}
                  {dealer.shop_registration_url && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>Shop Registration</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href={dealer.shop_registration_url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    </div>
                  )}
                  {!dealer.gst_certificate_url && !dealer.pan_card_url && !dealer.shop_registration_url && (
                    <p className="text-muted-foreground">No documents uploaded</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-center text-muted-foreground py-8">Dealer not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
