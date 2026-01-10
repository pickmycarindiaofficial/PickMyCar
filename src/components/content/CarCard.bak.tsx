import { Heart, Phone, MapPin, Gauge, Fuel, Cog, Share2, Eye } from 'lucide-react';
import { useEffect } from 'react';
import { Car } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEventTracking } from '@/hooks/useEventTracking';

interface CarCardProps {
  car: Car;
  onCallDealer: (car: Car) => void;
  onChat: (car: Car) => void;
  onToggleShortlist: (carId: string) => void;
  isShortlisted: boolean;
  onCardClick?: (car: Car) => void;
  onShare?: (car: Car) => void;
}

export const CarCard = ({ car, onCallDealer, onChat, onToggleShortlist, isShortlisted, onCardClick, onShare }: CarCardProps) => {
  const { trackFunnel } = useEventTracking();

  useEffect(() => {
    trackFunnel.mutate({
      stage: 'view',
      car_id: car.id,
      meta: { card_position: 'listing_grid' }
    });
  }, [car.id]);

  const formatPrice = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    return `₹${(value / 100000).toFixed(2)} Lakh`;
  };

  const formatKmsFull = (kms: number) => {
    return `${kms.toLocaleString('en-IN')} miles`;
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl cursor-pointer ${car.isFeatured ? 'border-[#f2a100]' : 'border-gray-200'
        }`}
      onClick={() => onCardClick?.(car)}
    >
      {/* Featured Header */}
      {car.isFeatured && (
        <div className="bg-[#f2a100] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider">
          FEATURED
        </div>
      )}

      {/* Image Section */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={car.imageUrl}
          alt={car.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Year Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/90 text-gray-800 hover:bg-white border-0 shadow-sm font-semibold">
            {car.year}
          </Badge>
        </div>

        {/* Action Icons - Left Side (Heart/Share) */}
        <div className="absolute bottom-3 left-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleShortlist(car.id);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors"
          >
            <Heart
              className={`h-4 w-4 ${isShortlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(car);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors"
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {/* Title & Dealer */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            {car.year} {car.brand} {car.model}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {car.variant || 'Premier Dealer'}
          </p>
        </div>

        {/* Price & Mileage */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-extrabold text-[#2563eb]">
            {formatPrice(car.price)}
          </div>
          <div className="text-sm font-medium text-gray-500">
            {formatKmsFull(car.kmsDriven)}
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-xs truncate">{car.city || 'Location'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Cog className="h-4 w-4 text-gray-400" />
            <span className="text-xs truncate">{car.transmission}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Fuel className="h-4 w-4 text-gray-400" />
            <span className="text-xs truncate">{car.fuelType}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Gauge className="h-4 w-4 text-gray-400" />
            <span className="text-xs truncate">{car.year}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="default"
            className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-5 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onCardClick?.(car);
            }}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-[#2563eb] text-[#2563eb] hover:bg-blue-50 font-semibold py-5 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onCallDealer(car);
            }}
          >
            Contact Dealer
          </Button>
        </div>
      </div>
    </div>
  );
};

