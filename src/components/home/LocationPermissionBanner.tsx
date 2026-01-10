import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface LocationPermissionBannerProps {
  onRequestLocation: () => void;
  onDismiss: () => void;
}

export const LocationPermissionBanner = ({ onRequestLocation, onDismiss }: LocationPermissionBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Find cars near you
              </p>
              <p className="text-xs text-muted-foreground">
                Allow location access to see personalized recommendations based on your area
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={onRequestLocation}
              className="whitespace-nowrap"
            >
              Allow Location
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
