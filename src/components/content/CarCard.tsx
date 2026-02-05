import {
  Fuel,
  Gauge,
  Heart,
  Calendar,
  MapPin,
  Tag,
  Phone,
  MessageCircle,
  TrendingDown,
  Share2,
} from 'lucide-react';
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
    if (kms >= 100000) return `${parseFloat((kms / 100000).toFixed(1))} Lakh km`;
    return `${parseFloat((kms / 1000).toFixed(1))}k km`;
  };

  return (
    <div
      ref={cardRef}
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl cursor-pointer ${car.isFeatured ? 'border-blue-200 shadow-blue-100/50' : 'border-border/50'
        }`}
      onClick={() => onCardClick?.(car)}
    >
      {/* Image Section */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        <img
          src={getOptimizedImageUrl(car.imageUrl, { width: 400, quality: 80 })}
          alt={`${car.year} ${car.brand} ${car.model}`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-contain transition-transform duration-700"
        />

        {/* Overlay Gradient - Bottom only for text contrast if needed */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Featured Badge - Top Left */}
        {car.isFeatured && (
          <div className="absolute top-0 left-0">
            <Badge className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none bg-[#FFB703] text-black border-0 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
              Featured
            </Badge>
          </div>
        )}

        {/* Shortlist Button - Top Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleShortlist(car.id);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-all shadow-sm"
        >
          <Heart
            className={`h-4 w-4 ${isShortlisted ? 'fill-red-500 text-red-500' : 'text-white'}`}
          />
        </button>

        {/* Share Button - Below Shortlist */}
        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(car);
            }}
            className="absolute top-12 right-2 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors backdrop-blur-[2px]"
          >
            <Share2 className="h-4 w-4 text-white" />
          </button>
        )}

        {/* Price Drop Badge - Bottom Left */}
        {car.priceDrop && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-green-600/90 backdrop-blur-sm text-white border-0 px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
              <TrendingDown className="mr-0.5 h-3 w-3" />
              ₹{(car.priceDrop.amount / 1000).toFixed(0)}k Off
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-3.5 space-y-3">
        {/* Header: Title + Price */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-gray-900 leading-snug truncate">
              {car.year} {car.brand} {car.model}
            </h3>
            <p className="text-[13px] text-muted-foreground font-medium truncate mt-0.5">
              {car.variant}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[17px] font-bold text-gray-900 leading-snug">
              {formatPrice(car.price)}
            </div>
            {car.emiPerMonth && (
              <div className="text-xs text-muted-foreground font-medium">
                EMI ₹{(car.emiPerMonth / 1000).toFixed(1)}k/m
              </div>
            )}
          </div>
        </div>

        {/* Specs Row */}
        {/* Specs Row */}
        {/* Specs Row - Highlights */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 bg-blue-50 px-2.5 py-1.5 rounded-lg w-fit mt-1">
          <span className="truncate">{formatKms(car.kmsDriven)}</span>
          <span className="text-blue-300">•</span>
          <span className="truncate">{car.fuelType}</span>
          <span className="text-blue-300">•</span>
          <span className="truncate">{car.transmission}</span>
          {car.location && (
            <>
              <span className="text-blue-300">•</span>
              <span className="truncate max-w-[80px]">{car.location.split(',')[0]}</span>
            </>
          )}
        </div>

        {/* Key Highlights - Fixed Height for Uniformity - 2 Line Grid */}
        {/* Key Highlights - Fixed Height for Uniformity - 2 Line Grid */}
        <div className="h-[60px] grid grid-cols-2 gap-x-2 gap-y-1.5 mt-2.5 content-start">
          {(car.reasonsToBuy && car.reasonsToBuy.length > 0 ? car.reasonsToBuy : car.features)
            .slice(0, 3)
            .map((highlight, idx) => (
              <div key={idx} className="flex items-center gap-1.5 overflow-hidden min-h-[20px]">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500/80 flex-shrink-0" />
                <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium truncate leading-tight tracking-tight">
                  {highlight}
                </span>
              </div>
            ))}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border/60" />

        {/* Action Area */}
        <div className="pt-0.5">
          <Button
            className="w-full h-9 p-0 text-sm font-bold text-white hover:opacity-90 transition-opacity uppercase tracking-wide shadow-sm"
            style={{ backgroundColor: 'rgb(38,100,235)' }}
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
