import { Heart, Phone, MessageCircle, Gauge, Fuel, Cog, TrendingDown, Info, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Car } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEventTracking } from '@/hooks/useEventTracking';
import { getOptimizedImageUrl } from '@/lib/photoUtils';

interface CarCardProps {
  car: Car;
  onCallDealer: (car: Car) => void;
  onChat: (car: Car) => void;
  onToggleShortlist: (carId: string) => void;
  isShortlisted: boolean;
  onCardClick?: (car: Car) => void;
  onShare?: (car: Car) => void;
  priority?: boolean;
}

export const CarCard = ({ car, onCallDealer, onChat, onToggleShortlist, isShortlisted, onCardClick, onShare, priority = false }: CarCardProps) => {
  const { trackFunnel } = useEventTracking();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    // Optimization: Use IntersectionObserver to track views only when visible
    // This prevents 100+ API calls on page load (API Flooding)
    if (hasTracked) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackFunnel.mutate({
            stage: 'view',
            car_id: car.id,
            meta: { card_position: 'listing_grid' }
          });
          setHasTracked(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 } // Require 50% visibility
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [car.id, hasTracked]);

  const formatPrice = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    return `₹${(value / 100000).toFixed(2)} Lakh`;
  };

  const formatKms = (kms: number) => {
    if (kms >= 100000) return `${(kms / 100000).toFixed(1)} Lakh km`;
    return `${(kms / 1000).toFixed(1)}k km`;
  };

  return (
    <div
      ref={cardRef}
      className={`group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer ${car.isFeatured
        ? 'border-blue-500/50'
        : 'border-border'
        }`}
      onClick={() => onCardClick?.(car)}
    >
      {/* Image Section - 16:10 Aspect Ratio for Compactness */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={getOptimizedImageUrl(car.imageUrl, { width: 400, quality: 75 })}
          alt={car.title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay for Text Readability if needed */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

        {/* Badges - Top Left - Compact */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <div className="flex flex-wrap gap-1">
            {car.isFeatured && (
              <Badge className="bg-yellow-400 text-black border-0 px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
                FEATURED
              </Badge>
            )}
            {(car.category === 'Brand Warranty' || car.category === 'New Car Warranty') && (
              <Badge className="bg-blue-600 text-white border-0 px-1.5 py-0.5 text-[10px] font-semibold shadow-sm">
                Warranty
              </Badge>
            )}
          </div>
        </div>

        {/* Heart Icon - Top Right - Compact */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleShortlist(car.id);
          }}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
        >
          <Heart
            className={`h-4 w-4 ${isShortlisted ? 'fill-red-500 text-red-500' : 'text-white'}`}
          />
        </button>

        {/* Price Drop - Bottom Left Overlay */}
        {car.priceDrop && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-0 px-1.5 py-0.5 text-[10px] font-medium animate-pulse">
              <TrendingDown className="mr-0.5 h-3 w-3" />
              ₹{(car.priceDrop.amount / 1000).toFixed(0)}k Off
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section - Compact Padding */}
      <div className="p-3 space-y-2">
        {/* Title & Price Row */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-gray-50 leading-tight truncate">
              {car.year} {car.brand} {car.model}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {car.variant}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-extrabold text-[#236ceb] leading-tight">
              {formatPrice(car.price)}
            </div>
            {car.emiPerMonth && (
              <div className="text-[10px] font-bold text-muted-foreground">
                ₹{(car.emiPerMonth / 1000).toFixed(1)}k/mo
              </div>
            )}
          </div>
        </div>

        {/* Inline Specs - Single Line - High Density & High Contrast */}
        <div className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-gray-300 font-medium overflow-hidden whitespace-nowrap">
          <span className="flex items-center gap-1">
            {formatKms(car.kmsDriven)}
          </span>
          <span className="text-gray-400">•</span>
          <span>{car.fuelType}</span>
          <span className="text-gray-400">•</span>
          <span>{car.transmission}</span>
          <span className="text-gray-400">•</span>
          <span className="truncate max-w-[80px]">{car.location}</span>
        </div>

        {/* Action Buttons - Full Width, Compact */}
        {/* Action Button - Single Contact Dealer */}
        <div className="pt-2 pb-1">
          <Button
            variant="default"
            size="default"
            onClick={(e) => {
              e.stopPropagation();
              onCallDealer(car);
            }}
            className="w-full h-11 font-bold bg-gradient-to-r from-[#236ceb] to-[#4b8cf5] hover:from-[#1e5bc9] hover:to-[#3a7de3] text-white shadow-md hover:shadow-lg transition-all text-sm uppercase tracking-wide"
          >
            <Phone className="mr-2 h-4 w-4" />
            Contact Dealer
          </Button>
        </div>

      </div>
    </div>
  );
};
