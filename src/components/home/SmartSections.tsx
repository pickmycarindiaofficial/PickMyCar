import { Car } from '@/types';
import { safeLocalStorage } from '@/lib/utils';
import { CarCard } from '@/components/content/CarCard';
import { CarCardSkeleton } from '@/components/content/CarCardSkeleton';
import { TrendingDown, MapPin, Eye, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { useState, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface SmartSectionsProps {
  cars: Car[];
  userLocation?: { latitude: number; longitude: number } | null;
  onCarClick: (car: Car) => void;
  onCallDealer: (car: Car) => void;
  onChat: (car: Car) => void;
  onToggleShortlist: (carId: string) => void;
  shortlistedIds: string[];
  isLoading?: boolean;
}

export const SmartSections = ({
  cars,
  userLocation,
  onCarClick,
  onCallDealer,
  onChat,
  onToggleShortlist,
  shortlistedIds,
  isLoading = false,
}: SmartSectionsProps) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch user profile to check buying_mode
  useEffect(() => {
    if (user) {
      // @ts-ignore - user_profile table not in generated types yet
      (supabase as any)
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data }: any) => {
          if (data) setUserProfile(data);
        });
    }
  }, [user]);

  // Get price drops (cars with originalPrice > expected_price)
  const priceDropCars = cars
    .filter(car => car.originalPrice && car.originalPrice > car.price)
    .slice(0, 6);

  // Get near you (if location available) - for now just show first 6
  const nearYouCars = cars.slice(0, 6);

  // Recently viewed from localStorage
  const recentlyViewedIds = JSON.parse(safeLocalStorage.getItem('recently_viewed') || '[]');
  const recentlyViewedCars = cars
    .filter(car => recentlyViewedIds.includes(car.id))
    .slice(0, 6);

  // Featured/trending
  const trendingCars = cars
    .filter(car => car.isFeatured)
    .slice(0, 6);

  const Section = ({
    title,
    icon: Icon,
    cars: sectionCars,
    color,
    showLoading = false
  }: {
    title: string;
    icon: any;
    cars: Car[];
    color: string;
    showLoading?: boolean;
  }) => {
    if (!showLoading && sectionCars.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full max-w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {showLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <CarouselItem key={i} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <CarCardSkeleton />
                </CarouselItem>
              ))
            ) : (
              sectionCars.map((car) => (
                <CarouselItem key={car.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <CarCard
                    car={car}
                    onCallDealer={() => onCallDealer(car)}
                    onChat={() => onChat(car)}
                    onToggleShortlist={() => onToggleShortlist(car.id)}
                    isShortlisted={shortlistedIds.includes(car.id)}
                    onCardClick={() => onCarClick(car)}
                  />
                </CarouselItem>
              ))
            )}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      <Section
        title="Deals for You"
        icon={TrendingDown}
        cars={priceDropCars}
        color="text-green-600"
        showLoading={isLoading}
      />

      {userLocation && (
        <Section
          title="Near You"
          icon={MapPin}
          cars={nearYouCars}
          color="text-blue-600"
          showLoading={isLoading}
        />
      )}

      {recentlyViewedCars.length > 0 && (
        <Section
          title="Recently Viewed"
          icon={Eye}
          cars={recentlyViewedCars}
          color="text-purple-600"
          showLoading={isLoading}
        />
      )}

      <Section
        title="Trending Now"
        icon={TrendingUp}
        cars={trendingCars}
        color="text-orange-600"
        showLoading={isLoading}
      />
    </div>
  );
};
