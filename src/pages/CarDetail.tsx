import { useMemo, useEffect } from 'react';
import { Car, Dealer } from '@/types';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNavbar } from '@/components/layout/MobileNavbar';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ImageFeatureOverlay } from '@/components/detail/ImageFeatureOverlay';
import { DetailsTabs } from '@/components/detail/DetailsTabs';
import { EMICalculator } from '@/components/detail/EMICalculator';
import { CarDetailFAQ } from '@/components/detail/CarDetailFAQ';
import { CarInfoCard } from '@/components/detail/CarInfoCard';
import { SimilarCars } from '@/components/detail/SimilarCars';
import { StickyActionBar } from '@/components/detail/StickyActionBar';
import { useToast } from '@/hooks/use-toast';
import { useEventTracking } from '@/hooks/useEventTracking';

interface CarDetailPageProps {
  car: Car;
  dealer: Dealer;
  isDealerLoading?: boolean;
  allCars: Car[];
  onBack: () => void;
  onCarClick: (car: Car) => void;
  onCallDealer: (car: Car) => void;
  onWhatsAppEnquiry: (car: Car) => void;
  onChat: (car: Car) => void;
  onToggleShortlist: (carId: string) => void;
  shortlistedIds: string[];
  onNavigate: (view: 'home' | 'buy' | 'sell' | 'shortlist') => void;
  onSearchSubmit: (term: string) => void;
  onBookTestDrive: () => void;
  onSocialShare: (platform: 'whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'telegram' | 'email') => void;
  onApplyForLoan?: () => void;
}

export const CarDetailPage = ({
  car,
  dealer,
  isDealerLoading = false,
  allCars,
  onBack,
  onCarClick,
  onCallDealer,
  onWhatsAppEnquiry,
  onChat,
  onToggleShortlist,
  shortlistedIds,
  onNavigate,
  onSearchSubmit,
  onBookTestDrive,
  onSocialShare,
  onApplyForLoan,
}: CarDetailPageProps) => {
  const { toast } = useToast();
  const { trackFunnel } = useEventTracking();

  const handleBookTestDriveClick = () => {
    if (onBookTestDrive) {
      onBookTestDrive();
    }
  };

  useEffect(() => {
    // Track funnel 'interest' stage when detail page loads
    if (car?.id && dealer?.id) {
      trackFunnel.mutate({
        stage: 'interest',
        car_id: car.id,
        dealer_id: dealer.id,
        meta: {
          arrived_from: document.referrer,
          car_price: car.price,
        }
      });
    }
  }, [car?.id, dealer?.id]);

  const allImages = useMemo(() => {
    const images = [car.imageUrl];
    if (car.multipleImageUrls) {
      images.push(...car.multipleImageUrls);
    }
    return images;
  }, [car]);

  const handleWhatsAppEnquiry = () => {
    onWhatsAppEnquiry(car);
  };

  const handleCallDealer = () => {
    onCallDealer(car);
  };

  const handleApplyForLoan = () => {
    if (onApplyForLoan) {
      onApplyForLoan();
    }
  };

  const handleDealerClick = () => {
    toast({
      title: 'Dealer Profile',
      description: `Viewing all cars from ${dealer.name}`,
    });
    onBack();
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Desktop Navbar */}
      <div className="hidden md:block sticky top-0 z-50">
        <Navbar
          onNavigate={onNavigate}
          onSearch={onSearchSubmit}
          onAuthAction={(action) => {
            toast({
              title: 'Authentication',
              description: `${action} clicked`,
            });
          }}
        />
      </div>

      {/* Mobile Navbar */}
      <div className="md:hidden">
        <MobileNavbar
          onSearch={onSearchSubmit}
          onBack={onBack}
          showBackButton
          title={car ? `${car.brand} ${car.model}` : 'Car Details'}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 py-6">
        <Breadcrumbs car={car} onBack={onBack} />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <ImageFeatureOverlay
              images={allImages}
              carTitle={car.title}
              features={(car as any).featuresMetadata || []}
            />

            {/* Key Highlights Section */}
            {car.reasonsToBuy && car.reasonsToBuy.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Key Highlights</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {car.reasonsToBuy.slice(0, 6).map((highlight, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-[#edf1ff] dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show Action Card on Mobile below images */}
            <div className="lg:hidden">
              <CarInfoCard
                car={car}
                dealer={dealer}
                dealerLoading={isDealerLoading}
                onWhatsAppClick={handleWhatsAppEnquiry}
                onCallClick={handleCallDealer}
                onApplyForLoan={handleApplyForLoan}
                onBookTestDrive={handleBookTestDriveClick}
                onSocialShare={onSocialShare}
              />
            </div>

            <DetailsTabs car={car} />
            <EMICalculator carPrice={car.price} onApplyForFinance={handleApplyForLoan} />
            <CarDetailFAQ car={car} />
          </div>

          {/* Right Column - Action Hub (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-1">
            <CarInfoCard
              car={car}
              dealer={dealer}
              dealerLoading={isDealerLoading}
              onWhatsAppClick={handleWhatsAppEnquiry}
              onCallClick={handleCallDealer}
              onApplyForLoan={handleApplyForLoan}
              onBookTestDrive={handleBookTestDriveClick}
              onSocialShare={onSocialShare}
            />
          </div>
        </div>

        {/* Similar Cars - Full Width */}
        <div className="mt-12">
          <SimilarCars
            currentCar={car}
            allCars={allCars}
            onCarClick={onCarClick}
            onCallDealer={onCallDealer}
            onChat={onChat}
            onToggleShortlist={onToggleShortlist}
            shortlistedIds={shortlistedIds}
          />
        </div>
      </div>

      {/* Sticky Action Bar for Mobile */}
      <StickyActionBar
        price={car.price}
        onCall={handleCallDealer}
        onWhatsApp={handleWhatsAppEnquiry}
        onBookTestDrive={handleBookTestDriveClick}
      />
    </div>
  );
};
