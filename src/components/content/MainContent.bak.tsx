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
      <div className="w-full space-y-8">
        {/* Results Header */}
        {!isLoading && sortedCars.length > 0 && (
          <div className="pb-2 border-b border-gray-100">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {sortedCars.length} Cars Found
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Showing results for your search criteria
            </p>
          </div>
        )}

        {/* City-specific content */}
        {showCityContent && (
          <CityContent city={city} totalCars={cars.length} cars={cars} />
        )}

        {/* Car Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        ) : paginatedCars.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Cars Found</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              We couldn't find any cars matching your filters. Try adjusting your preferences to see more results.
            </p>
            {onClearFilters && (
              <Button onClick={onClearFilters} variant="default" className="bg-[#2563eb]">
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Featured Listings Section */}
            {paginatedCars.some(c => c.isFeatured) && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">Featured Listings</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {paginatedCars.filter(c => c.isFeatured).map((car) => (
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
              </section>
            )}

            {/* Loan Banner */}
            {currentPage === 1 && onApplyLoan && onOpenEMICalculator && (
              <LoanOffersBanner
                onCheckLoanOffers={onApplyLoan}
                onOpenEMICalculator={onOpenEMICalculator}
                averageCarPrice={averageCarPrice}
              />
            )}

            {/* All Listings Section */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">All Listings</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {paginatedCars.filter(c => !c.isFeatured).map((car) => (
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
                {/* Fallback if no non-featured cars on this page but there are cars */}
                {paginatedCars.length > 0 && paginatedCars.every(c => c.isFeatured) && (
                  <div className="col-span-full py-8 text-center text-gray-500 text-sm italic">
                    All cars on this page are featured.
                  </div>
                )}
              </div>
            </section>
          </div>
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
