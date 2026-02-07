import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Car, SortOption } from '@/types';
import { CarCard } from './CarCard';
import { CarCardSkeleton } from './CarCardSkeleton';
import { CityContent } from './CityContent';
import { FAQSection } from './FAQSection';
import { LoanOffersBanner } from '@/components/finance/LoanOffersBanner';
import { InlineLoader } from '@/components/common/PageLoader';

interface MainContentProps {
  cars: Car[];
  city: string;
  onCallDealer: (car: Car) => void;
  onChat: (car: Car) => void;
  onToggleShortlist: (carId: string) => void;
  shortlistedIds: string[];
  onCarClick?: (car: Car) => void;
  onShare?: (car: Car) => void;
  onClearFilters?: () => void;
  sortOption: SortOption;
  isLoading?: boolean;
  onApplyLoan?: () => void;
  onOpenEMICalculator?: () => void;
  averageCarPrice?: number;
  segment?: 'all' | 'premium';
}

const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_INCREMENT = 12;

export const MainContent = ({
  cars,
  city,
  onCallDealer,
  onChat,
  onToggleShortlist,
  shortlistedIds,
  onCarClick,
  onShare,
  onClearFilters,
  sortOption,
  isLoading = false,
  onApplyLoan,
  onOpenEMICalculator,
  averageCarPrice = 500000,
  segment = 'all',
}: MainContentProps) => {
  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset visible count when filters/cars change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [cars.length, city, segment]);

  // Sort cars
  const sortedCars = useMemo(() => {
    let result = [...cars];

    // Default Sort (Relevance) -> Strategic Randomization
    if (sortOption === 'relevance') {
      const featured = result.filter(c => c.isFeatured);
      const regularWithoutFeatured = result.filter(c => !c.isFeatured);

      // Limit top featured to 6
      const topFeatured = featured.slice(0, 6);
      const remainingFeatured = featured.slice(6);

      // Merge remaining featured with regular cars for the shuffle pool
      const poolToShuffle = [...remainingFeatured, ...regularWithoutFeatured];

      // Stable seeded shuffle for "Fair Dealer Visibility"
      // We use a simple random sort here, but in a real app you might use a daily seed
      // Fisher-Yates Shuffle
      for (let i = poolToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [poolToShuffle[i], poolToShuffle[j]] = [poolToShuffle[j], poolToShuffle[i]];
      }

      return [...topFeatured, ...poolToShuffle];
    }

    // Other sort options
    return result.sort((a, b) => {
      switch (sortOption) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'year-new':
          return b.year - a.year;
        case 'year-old':
          return a.year - b.year;
        case 'kms-low':
          return a.kmsDriven - b.kmsDriven;
        default:
          return 0;
      }
    });
  }, [cars, sortOption]);

  // Derived visible cars
  const visibleCars = sortedCars.slice(0, visibleCount);
  const hasMore = visibleCount < sortedCars.length;

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          // Add small delay for better UX
          setTimeout(() => {
            setVisibleCount((prev) => prev + LOAD_MORE_INCREMENT);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  const showCityContent = city !== 'All Cities';

  return (
    <main className="w-full">
      <div className="w-full space-y-6">
        {/* City-specific content */}
        {showCityContent && (
          <CityContent city={city} totalCars={cars.length} cars={cars} />
        )}

        {/* Premium Banner */}
        {segment === 'premium' && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-500 ring-1 ring-inset ring-amber-500/40">
                  💎 Premium Collection
                </span>
              </div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white">
                Luxury & Exotic Cars
              </h1>
              <p className="max-w-xl text-slate-300">
                Explore our curated selection of premium vehicles. Verified luxury brands, superior condition, and exclusive ownership benefits.
              </p>
            </div>
          </div>
        )}

        {/* Car Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedCars.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">No Cars Found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters to see more results
            </p>
            {onClearFilters && (
              <Button onClick={onClearFilters} variant="outline">
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* First 3 Cars */}
            <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
              {visibleCars.slice(0, 3).map((car, index) => (
                <CarCard
                  key={car.id}
                  car={car}
                  onCallDealer={onCallDealer}
                  onChat={onChat}
                  onToggleShortlist={onToggleShortlist}
                  isShortlisted={shortlistedIds.includes(car.id)}
                  onCardClick={onCarClick}
                  onShare={onShare}
                  priority={index < 2} // Priority for top 2 on mobile
                />
              ))}
            </div>

            {/* Loan Banner - FULL WIDTH, BETWEEN ROWS */}
            {visibleCars.length >= 3 && onApplyLoan && onOpenEMICalculator && (
              <LoanOffersBanner
                onCheckLoanOffers={onApplyLoan}
                onOpenEMICalculator={onOpenEMICalculator}
                averageCarPrice={averageCarPrice}
              />
            )}

            {/* Remaining Cars (4 onwards) */}
            {visibleCars.length > 3 && (
              <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
                {visibleCars.slice(3).map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    onCallDealer={onCallDealer}
                    onChat={onChat}
                    onToggleShortlist={onToggleShortlist}
                    isShortlisted={shortlistedIds.includes(car.id)}
                    onCardClick={onCarClick}
                    onShare={onShare}
                  />
                ))}
              </div>
            )}

            {/* Infinite Scroll Loader / Trigger */}
            <div ref={loadMoreRef} className="col-span-full flex justify-center py-8 h-20">
              {hasMore ? (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                  <InlineLoader /> Loading more cars...
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">You've reached the end of the list</p>
              )}
            </div>
          </>
        )}

        {/* FAQ Section */}
        <FAQSection city={city} totalCars={cars.length} />
      </div>
    </main>
  );
};
