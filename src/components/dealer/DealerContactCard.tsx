import { Facebook, Globe, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DealerFullProfile } from '@/hooks/useDealerFullProfile';

interface DealerContactCardProps {
  dealer: DealerFullProfile;
  onCallClick: () => void;
  onWhatsAppClick: () => void;
}

export function DealerContactCard({ dealer, onCallClick, onWhatsAppClick }: DealerContactCardProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Phone className="w-4 h-4" />
          Contact Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {/* Compact Address */}
        <div className="flex gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-medium mb-0.5">Address</div>
            <div className="text-muted-foreground">
              {dealer.address}, {dealer.city}, {dealer.state} - {dealer.pincode}
            </div>
          </div>
        </div>

        {/* Compact Phone */}
        {dealer.phone_number && (
          <div className="flex gap-2">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-medium mb-0.5">Phone</div>
              <div className="text-muted-foreground">{dealer.phone_number}</div>
            </div>
          </div>
        )}

        {/* Action Buttons - Compact */}
        <div className="space-y-2 pt-3 border-t">
          <Button onClick={onCallClick} className="w-full" size="sm">
            <Phone className="w-3 h-3 mr-1" />
            Call Dealer
          </Button>
          <Button onClick={onWhatsAppClick} variant="outline" className="w-full" size="sm">
            WhatsApp
          </Button>
        </div>

        {/* Compact Social Media */}
        {dealer.show_social_media !== false && (dealer.facebook_url || dealer.instagram_url || dealer.twitter_url || dealer.website_url) && (
          <div className="pt-3 border-t">
            <div className="text-xs font-medium mb-2">Follow Us</div>
            <div className="flex gap-1.5">
              {dealer.facebook_url && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(dealer.facebook_url!, '_blank')}
                >
                  <Facebook className="w-3 h-3" />
                </Button>
              )}
              {dealer.instagram_url && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(dealer.instagram_url!, '_blank')}
                >
                  <Instagram className="w-3 h-3" />
                </Button>
              )}
              {dealer.twitter_url && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(dealer.twitter_url!, '_blank')}
                >
                  <Twitter className="w-3 h-3" />
                </Button>
              )}
              {dealer.website_url && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(dealer.website_url!, '_blank')}
                >
                  <Globe className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Operating Hours */}
        {dealer.show_operating_hours !== false && dealer.operating_hours && (
          <div className="pt-3 border-t">
            <div className="text-xs font-medium mb-2">Operating Hours</div>
            <div className="space-y-1 text-xs">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {Object.entries(dealer.operating_hours).map(([day, hours]: [string, any]) => (
                <div key={day} className="flex justify-between">
                  <span className="capitalize text-muted-foreground">{day}</span>
                  <span className="font-medium">
                    {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
