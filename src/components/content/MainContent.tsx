import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Car, SortOption } from '@/types';
import { CarCard } from './CarCard';
import { CarCardSkeleton } from './CarCardSkeleton';
import { CityContent } from './CityContent';
import { Pagination } from './Pagination';
import { FAQSection } from './FAQSection';
import { LoanOffersBanner } from '@/components/finance/LoanOffersBanner';

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

const CARS_PER_PAGE = 12;

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
  const [currentPage, setCurrentPage] = useState(1);

  // Sort cars
  const sortedCars = [...cars].sort((a, b) => {
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
        return b.isFeatured ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedCars.length / CARS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARS_PER_PAGE;
  const paginatedCars = sortedCars.slice(startIndex, startIndex + CARS_PER_PAGE);

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
        ) : paginatedCars.length === 0 ? (
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
              {paginatedCars.slice(0, 3).map((car, index) => (
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
            {currentPage === 1 && paginatedCars.length >= 3 && onApplyLoan && onOpenEMICalculator && (
              <LoanOffersBanner
                onCheckLoanOffers={onApplyLoan}
                onOpenEMICalculator={onOpenEMICalculator}
                averageCarPrice={averageCarPrice}
              />
            )}

            {/* Remaining Cars (4 onwards) */}
            {paginatedCars.length > 3 && (
              <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
                {paginatedCars.slice(3).map((car) => (
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
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* FAQ Section */}
        <FAQSection city={city} totalCars={cars.length} />
      </div>
    </main>
  );
};
