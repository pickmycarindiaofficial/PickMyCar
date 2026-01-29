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
      className={`group relative overflow-hidden rounded-2xl border-2 bg-card shadow-md transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer ${car.isFeatured
        ? 'border-blue-500 hover:border-blue-600'
        : 'border-border hover:border-primary/50'
        }`}
      onClick={() => onCardClick?.(car)}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
        <img
          src={getOptimizedImageUrl(car.imageUrl, { width: 400, quality: 75 })}
          alt={car.title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {car.isFeatured && (
              <Badge className="bg-yellow-400 text-black border-0 px-2.5 py-1 text-xs font-semibold shadow-sm hover:bg-yellow-500">
                ⭐ Featured
              </Badge>
            )}
            {(car.category === 'Brand Warranty' || car.category === 'New Car Warranty') && (
              <Badge className="bg-[#236ceb] text-white border-0 px-2.5 py-1 text-xs font-semibold shadow-sm">
                Warranty
              </Badge>
            )}
            {car.owner === '1st Owner' && (
              <Badge className="bg-[hsl(var(--badge-owner-bg))] text-[hsl(var(--badge-owner-text))] border-0 px-2.5 py-1 text-xs font-semibold shadow-sm">
                1st Owner
              </Badge>
            )}
            {car.category === 'Certified' && (
              <Badge className="bg-[hsl(var(--badge-certified-bg))] text-[hsl(var(--badge-certified-text))] border-0 px-2.5 py-1 text-xs font-semibold shadow-sm">
                Certified
              </Badge>
            )}
          </div>

          {/* Price Drop */}
          {car.priceDrop && (
            <div className="flex">
              <Badge className="bg-[hsl(var(--badge-price-drop-bg))] text-[hsl(var(--badge-price-drop-text))] border-0 px-2.5 py-1 text-xs font-semibold shadow-md animate-pulse">
                <TrendingDown className="mr-1 h-3 w-3" />
                ₹{(car.priceDrop.amount / 1000).toFixed(0)}K Drop {car.priceDrop.label && `• ${car.priceDrop.label}`}
              </Badge>
            </div>
          )}
        </div>

        {/* Heart + Share Icons - Top Right (Stacked) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {/* Heart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleShortlist(car.id);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
          >
            <Heart
              className={`h-5 w-5 ${isShortlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
            />
          </button>

          {/* Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(car);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
          >
            <Share2 className="h-4 w-4 text-gray-700" />
          </button>
        </div>

      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title + Price Row - Always side by side */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">
              {car.year} {car.brand} {car.model}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {car.variant}
            </p>
          </div>
          {/* Modern Price Design */}
          <div className="flex-shrink-0 text-right">
            <div className="text-xl font-extrabold bg-gradient-to-r from-[#236ceb] to-[#4b8cf5] bg-clip-text text-transparent whitespace-nowrap">
              {formatPrice(car.price)}
            </div>
            {car.emiPerMonth && (
              <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-semibold">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                ₹{car.emiPerMonth.toLocaleString('en-IN')}/mo
              </div>
            )}
          </div>
        </div>

        {/* Specs Row - Icon Based Design */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground font-medium">{formatKms(car.kmsDriven)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground font-medium">{car.fuelType}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cog className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground font-medium">{car.transmission}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="truncate">{car.location}</span>
        </div>

        {/* Highlights - Fixed 2-line height for consistent card alignment */}
        <div className="min-h-[52px] flex flex-col gap-1">
          {car.reasonsToBuy && car.reasonsToBuy.length > 0 ? (
            <>
              {/* First line - always show first highlight */}
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium w-fit">
                <svg className="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="truncate max-w-[180px]">{car.reasonsToBuy[0]}</span>
              </div>
              {/* Second line - show remaining highlights (2nd and 3rd) together or just 2nd */}
              {car.reasonsToBuy.length >= 2 && (
                <div className="flex flex-wrap gap-1">
                  {car.reasonsToBuy.slice(1, 3).map((highlight, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium"
                    >
                      <svg className="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate max-w-[100px]">{highlight}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Empty placeholder to maintain consistent height when no highlights */
            <div className="h-full" />
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 px-4 py-3 rounded-b-2xl">
        <Button
          variant="default"
          size="default"
          onClick={(e) => {
            e.stopPropagation();
            onCallDealer(car);
          }}
          className="w-full font-semibold bg-gradient-to-r from-[#236ceb] to-[#4b8cf5] hover:from-[#1e5bc9] hover:to-[#3a7de3] text-white shadow-md hover:shadow-lg transition-all"
        >
          <Phone className="mr-2 h-4 w-4" />
          Contact Dealer
        </Button>
      </div>
    </div>
  );
};
