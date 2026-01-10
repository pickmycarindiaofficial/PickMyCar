import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, Loader2, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { CarCard } from '@/components/content/CarCard';
import { ShareDialog } from '@/components/common/ShareDialog';
import { LoanOffersSection } from '@/components/saved-cars/LoanOffersSection';
import { BenefitsSection } from '@/components/saved-cars/BenefitsSection';
import { TrustSignalsSection } from '@/components/saved-cars/TrustSignalsSection';
import { FAQSection } from '@/components/saved-cars/FAQSection';
import { SimilarCarsSection } from '@/components/saved-cars/SimilarCarsSection';
import { TrendingCarsSection } from '@/components/saved-cars/TrendingCarsSection';
import { useSavedCars, useRemoveSavedCar, useAddSavedCar } from '@/hooks/useSavedCars';
import { useSimilarToSavedCars } from '@/hooks/useSimilarToSavedCars';
import { useTrendingCars } from '@/hooks/useTrendingCars';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useEventTracking } from '@/hooks/useEventTracking';
import { useCreateEnquiry } from '@/hooks/useEnquiries';
import { Car } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { parsePhotos } from '@/lib/photoUtils';

export default function SavedCars() {
  const navigate = useNavigate();
  const { requireAuth } = useAuthGuard();
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [carToShare, setCarToShare] = useState<Car | null>(null);

  // Data fetching
  const { data: savedCars, isLoading } = useSavedCars();
  const removeSavedCar = useRemoveSavedCar();
  const addSavedCar = useAddSavedCar();
  const { trackEvent } = useEventTracking();
  const createEnquiry = useCreateEnquiry();

  // Get IDs for exclusion
  const savedCarIds = savedCars?.map((item: any) => item.car_listing_id) || [];
  
  // Similar and trending cars
  const { data: similarCars, isLoading: isLoadingSimilar } = useSimilarToSavedCars();
  const { data: trendingCars, isLoading: isLoadingTrending } = useTrendingCars(savedCarIds);

  // Track page view
  useEffect(() => {
    trackEvent.mutate({ event: 'view', meta: { page: 'saved_cars' } });
  }, []);

  // Update shortlisted IDs when saved cars change
  useEffect(() => {
    if (savedCars) {
      setShortlistedIds(savedCars.map((item: any) => item.car_listing_id));
    }
  }, [savedCars]);

  // Transform saved cars data to Car type
  const transformSavedCarData = (savedCar: any): Car => {
    const listing = savedCar.car_listings;
    const photos = parsePhotos(listing.photos);
    
    return {
      id: listing.id,
      title: `${listing.brands?.name || ''} ${listing.models?.name || ''} ${listing.variant || ''}`.trim(),
      year: listing.year_of_make,
      brand: listing.brands?.name || '',
      model: listing.models?.name || '',
      variant: listing.variant || '',
      price: Number(listing.expected_price),
      imageUrl: photos[0] || '/placeholder.svg',
      multipleImageUrls: photos,
      kmsDriven: listing.kms_driven,
      fuelType: listing.fuel_types?.name || 'Petrol',
      transmission: listing.transmissions?.name || 'Manual',
      owner: '1st Owner',
      location: listing.cities?.name || '',
      city: listing.cities?.name || '',
      bodyType: listing.body_types?.name || '',
      category: listing.car_categories?.name || 'Non Warranty',
      features: [],
      seats: 5,
      color: listing.color || '',
      availability: listing.status === 'live' ? 'In Stock' : 'Sold',
      isFeatured: listing.is_featured || false,
      dealerId: listing.seller_id || '',
      sellerId: listing.seller_id || '',
      reasonsToBuy: listing.highlights || [],
    };
  };


  // Calculate average price for loan section
  const averagePrice = savedCars?.length > 0
    ? savedCars.reduce((sum: number, item: any) => sum + Number(item.car_listings.expected_price), 0) / savedCars.length
    : 500000;

  const handleCallDealer = async (car: Car) => {
    requireAuth(async () => {
      trackEvent.mutate({ event: 'contact_click', car_id: car.id, meta: { type: 'call' } });
      
      const { data: dealerProfile, error } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, phone_number')
        .eq('id', car.dealerId)
        .single();
      
      if (error || !dealerProfile?.phone_number) {
        toast.error('Dealer contact not available');
        return;
      }
      
      createEnquiry.mutate({
        carListingId: car.id,
        dealerId: dealerProfile.id,
        enquiryType: 'call',
      }, {
        onSuccess: () => {
          window.location.href = `tel:${dealerProfile.phone_number}`;
          toast.success(`Calling ${dealerProfile.full_name}`);
        },
      });
    }, { message: 'Please login to contact the dealer' });
  };

  const handleChat = (car: Car) => {
    trackEvent.mutate({ event: 'contact_click', car_id: car.id, meta: { type: 'chat' } });
    toast.info('Opening chat...');
  };

  const handleToggleShortlist = (carId: string) => {
    requireAuth(() => {
      const isCurrentlySaved = shortlistedIds.includes(carId);
      
      if (isCurrentlySaved) {
        setShortlistedIds((prev) => prev.filter((id) => id !== carId));
        removeSavedCar.mutate(carId);
        trackEvent.mutate({ event: 'wishlist_remove', car_id: carId });
      } else {
        setShortlistedIds((prev) => [...prev, carId]);
        addSavedCar.mutate(carId);
        trackEvent.mutate({ event: 'wishlist_add', car_id: carId });
      }
    }, { message: 'Please login to save cars' });
  };

  const handleCardClick = (car: Car) => {
    trackEvent.mutate({ event: 'click', car_id: car.id, meta: { source: 'saved_cars' } });
    navigate(`/car/${car.id}`);
  };

  const handleShare = (car: Car) => {
    trackEvent.mutate({ event: 'click', car_id: car.id, meta: { action: 'share' } });
    setCarToShare(car);
    setShareDialogOpen(true);
  };

  // Schema.org structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Your Saved Cars - Shortlisted Used Cars",
    "description": "Browse your collection of saved used cars. Compare prices, get instant loan approval, and connect with verified dealers.",
    "numberOfItems": savedCars?.length || 0,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": savedCars?.length || 0,
      "itemListElement": savedCars?.map((item: any, index: number) => ({
        "@type": "Car",
        "position": index + 1,
        "name": `${item.car_listings.brands?.name} ${item.car_listings.models?.name} ${item.car_listings.variant}`,
        "offers": {
          "@type": "Offer",
          "price": item.car_listings.expected_price,
          "priceCurrency": "INR"
        }
      })) || []
    }
  };

  return (
    <>
      <Helmet>
        <title>Your Saved Cars - Best Used Cars & Second Hand Cars in India | PickMyCar</title>
        <meta 
          name="description" 
          content="Browse your shortlisted used cars. Find best deals on certified pre-owned cars with warranty. Compare prices, get instant loan approval from top banks. 1000+ verified sellers across India." 
        />
        <meta 
          name="keywords" 
          content="saved cars, my saved cars, shortlisted cars, used cars, second hand cars, pre-owned cars, buy used cars online, certified used cars India, used car loan, car finance" 
        />
        
        {/* Open Graph */}
        <meta property="og:title" content="Your Favorite Used Cars - Pre-Owned Cars Collection" />
        <meta property="og:description" content="Compare your shortlisted used cars. Get instant loan offers and connect with verified dealers." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Saved Cars - Best Used Cars India" />
        <meta name="twitter:description" content="Browse your collection of handpicked used cars with instant loan options" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        
        {/* Canonical */}
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar 
          onSearch={() => {}}
          onNavigate={(view) => view === 'home' && navigate('/')}
          onAuthAction={() => {}}
        />

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Section */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Shortlisted Cars</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/20 rounded-full border border-red-200 dark:border-red-800">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <span className="font-semibold text-lg">{savedCars?.length || 0}</span>
                <span className="text-sm text-muted-foreground">saved</span>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          )}

          {/* Saved Cars Grid */}
          {!isLoading && savedCars && savedCars.length > 0 && (
            <div className="mb-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedCars.map((savedCar: any) => {
                  const car = transformSavedCarData(savedCar);
                  return (
                    <CarCard
                      key={car.id}
                      car={car}
                      onCallDealer={handleCallDealer}
                      onChat={handleChat}
                      onToggleShortlist={handleToggleShortlist}
                      isShortlisted={true}
                      onCardClick={handleCardClick}
                      onShare={handleShare}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!savedCars || savedCars.length === 0) && (
            <Card className="py-20 text-center">
              <CardContent>
                <Heart className="w-20 h-20 mx-auto mb-6 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-3">No saved cars yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start building your collection by clicking the heart icon on any car you like
                </p>
                <Button onClick={() => navigate('/')}>
                  Browse Cars
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loan Offers Section */}
          {savedCars && savedCars.length > 0 && (
            <LoanOffersSection averageCarPrice={averagePrice} />
          )}

          {/* Trending Cars Section - After Loan Offers */}
          {savedCars && savedCars.length > 0 && (
            <TrendingCarsSection
              cars={trendingCars || []}
              isLoading={isLoadingTrending}
              onCallDealer={handleCallDealer}
              onChat={handleChat}
              onToggleShortlist={handleToggleShortlist}
              shortlistedIds={shortlistedIds}
              onCardClick={handleCardClick}
              onShare={handleShare}
            />
          )}

          {/* Similar Cars Section */}
          {savedCars && savedCars.length > 0 && (
            <SimilarCarsSection
              cars={similarCars || []}
              isLoading={isLoadingSimilar}
              onCallDealer={handleCallDealer}
              onChat={handleChat}
              onToggleShortlist={handleToggleShortlist}
              shortlistedIds={shortlistedIds}
              onCardClick={handleCardClick}
              onShare={handleShare}
            />
          )}

          {/* Benefits Section */}
          {savedCars && savedCars.length > 0 && (
            <BenefitsSection />
          )}

          {/* Trust Signals */}
          {savedCars && savedCars.length > 0 && (
            <TrustSignalsSection />
          )}

          {/* FAQ Section - Last */}
          {savedCars && savedCars.length > 0 && (
            <FAQSection />
          )}
        </main>

        {/* Share Dialog */}
        {carToShare && (
          <ShareDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            car={carToShare}
          />
        )}
      </div>
    </>
  );
}
