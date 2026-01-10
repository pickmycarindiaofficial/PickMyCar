import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DealerFullProfile } from '@/hooks/useDealerFullProfile';

interface DealerMapLocationProps {
  dealer: DealerFullProfile;
}

export function DealerMapLocation({ dealer }: DealerMapLocationProps) {
  const mapQuery = encodeURIComponent(
    `${dealer.dealership_name}, ${dealer.address}, ${dealer.city}, ${dealer.state} ${dealer.pincode}`
  );
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${mapQuery}`;

  // Fallback to static map if no API key
  const fallbackMapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="w-4 h-4" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="aspect-[4/3] w-full">
          <iframe
            src={fallbackMapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${dealer.dealership_name} Location`}
          />
        </div>
        <div className="p-3 bg-muted">
          <p className="text-xs text-muted-foreground">
            {dealer.address}, {dealer.city}, {dealer.state} - {dealer.pincode}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
