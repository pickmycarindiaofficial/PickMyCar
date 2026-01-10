import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, MessageSquare, Calendar, MapPin, Fuel, Gauge, Users, Palette } from 'lucide-react';
import { useCarListingById } from '@/hooks/useCarListingById';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface CarDetailSheetProps {
  carId: string | null;
  open: boolean;
  onClose: () => void;
}

export function CarDetailSheet({ carId, open, onClose }: CarDetailSheetProps) {
  const { data: car, isLoading } = useCarListingById(carId || '');

  if (!carId) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : car ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-2xl">
                {car.brand} {car.model}
              </SheetTitle>
              <SheetDescription>
                {car.year} • {car.variant}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Primary Image */}
              {car.imageUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={car.imageUrl}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Eye className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{car.kmsDriven || 0}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <MessageSquare className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Test Drives</p>
                </div>
              </div>

              {/* Price */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Expected Price</p>
                <p className="text-3xl font-bold text-primary">
                  ₹{(car.price / 100000).toFixed(2)}L
                </p>
              </div>

              <Separator />

              {/* Details */}
              <div className="space-y-3">
                <h3 className="font-semibold">Car Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Year</p>
                      <p className="font-medium">{car.year}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fuel Type</p>
                      <p className="font-medium">{car.fuelType}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">KMs Driven</p>
                      <p className="font-medium">{car.kmsDriven.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <p className="font-medium">{car.owner}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Color</p>
                      <p className="font-medium">{car.color}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{car.city}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Badge */}
              <div>
                <Badge variant="secondary" className="text-sm">
                  {car.category}
                </Badge>
              </div>

              {/* Posted Info */}
              <div className="text-xs text-muted-foreground">
                Posted {formatDistanceToNow(new Date(), { addSuffix: true })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Car not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
