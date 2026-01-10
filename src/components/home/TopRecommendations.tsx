import { Car } from '@/types';
import { CarCard } from '@/components/content/CarCard';
import { CarCardSkeleton } from '@/components/content/CarCardSkeleton';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface TopRecommendationsProps {
  cars: Car[];
  onCarClick: (car: Car) => void;
  onCallDealer: (car: Car) => void;
  onChat: (car: Car) => void;
  onToggleShortlist: (carId: string) => void;
  shortlistedIds: string[];
  fitScores?: Record<string, number>;
  isLoading?: boolean;
}

export const TopRecommendations = ({
  cars,
  onCarClick,
  onCallDealer,
  onChat,
  onToggleShortlist,
  shortlistedIds,
  fitScores = {},
  isLoading = false,
}: TopRecommendationsProps) => {
  // Sort by FitScore if available, otherwise by featured/price
  const sortedCars = [...cars]
    .sort((a, b) => {
      const scoreA = fitScores[a.id] || 0;
      const scoreB = fitScores[b.id] || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    })
    .slice(0, 12);

  if (!isLoading && sortedCars.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-3xl font-bold">Recommended for You</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Personalized picks based on your preferences
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          Top {sortedCars.length} Matches
        </Badge>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full max-w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <CarouselItem key={i} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <CarCardSkeleton />
              </CarouselItem>
            ))
          ) : (
            sortedCars.map((car, index) => {
              const fitScore = fitScores[car.id];
              return (
                <CarouselItem key={car.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <div className="relative">
                    {index < 3 && (
                      <Badge 
                        className="absolute -top-2 -right-2 z-10" 
                        variant={index === 0 ? 'default' : 'secondary'}
                      >
                        #{index + 1} Match
                      </Badge>
                    )}
                    {fitScore && fitScore >= 75 && (
                      <Badge 
                        className="absolute -top-2 -left-2 z-10 bg-green-600 text-white" 
                        variant="default"
                      >
                        {Math.round(fitScore)}% Match
                      </Badge>
                    )}
                    <CarCard
                      car={car}
                      onCallDealer={() => onCallDealer(car)}
                      onChat={() => onChat(car)}
                      onToggleShortlist={() => onToggleShortlist(car.id)}
                      isShortlisted={shortlistedIds.includes(car.id)}
                      onCardClick={() => onCarClick(car)}
                    />
                  </div>
                </CarouselItem>
              );
            })
          )}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};
