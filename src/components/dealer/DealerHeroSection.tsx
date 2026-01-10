import { Building2, CheckCircle2, MapPin, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DealerFullProfile } from '@/hooks/useDealerFullProfile';

interface DealerHeroSectionProps {
  dealer: DealerFullProfile;
  onCallClick: () => void;
  onWhatsAppClick: () => void;
}

export function DealerHeroSection({ dealer, onCallClick, onWhatsAppClick }: DealerHeroSectionProps) {
  const bannerUrl = dealer.banner_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&h=400&fit=crop';
  const logoUrl = dealer.logo_url || dealer.avatar_url;

  return (
    <div className="relative">
      {/* Banner Image - Compact */}
      {dealer.show_banner !== false && (
        <div className="h-32 md:h-40 overflow-hidden rounded-t-lg">
          <img
            src={bannerUrl}
            alt={`${dealer.dealership_name} banner`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Dealer Info Card - Compact */}
      <div className="relative px-4 pb-3 -mt-8 md:-mt-12">
        <div className="bg-card rounded-lg shadow-lg p-4 border">
          <div className="flex items-start gap-4">
            {/* Logo - Compact */}
            {dealer.show_logo !== false && (
              <div className="flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 border-background bg-card overflow-hidden shadow-lg">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={dealer.dealership_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info - Compact */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-xl md:text-2xl font-bold">{dealer.dealership_name}</h1>
                    {dealer.is_active && (
                      <Badge variant="default" className="gap-1 text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{dealer.city}, {dealer.state}</span>
                    </div>
                    {dealer.year_established && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>Since {dealer.year_established}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats - Inline */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-primary">{dealer.active_listings}</span>
                      <span className="text-muted-foreground">Cars</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-primary">{dealer.sold_count}</span>
                      <span className="text-muted-foreground">Sold</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-primary">
                        {dealer.year_established ? new Date().getFullYear() - dealer.year_established : 0}+
                      </span>
                      <span className="text-muted-foreground">Yrs</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Desktop Compact */}
                <div className="hidden md:flex gap-2 flex-shrink-0">
                  <Button onClick={onCallClick} size="sm">
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  <Button onClick={onWhatsAppClick} variant="outline" size="sm">
                    WhatsApp
                  </Button>
                </div>
              </div>

              {/* Specializations - Compact */}
              {dealer.specialization && dealer.specialization.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {dealer.specialization.slice(0, 3).map((spec, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Mobile */}
          <div className="flex md:hidden gap-2 mt-3 pt-3 border-t">
            <Button onClick={onCallClick} size="sm" className="flex-1">
              <Phone className="w-4 h-4 mr-1" />
              Call
            </Button>
            <Button onClick={onWhatsAppClick} variant="outline" size="sm" className="flex-1">
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
