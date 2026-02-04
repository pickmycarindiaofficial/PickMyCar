import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/filters/Sidebar';
import { MainContent } from '@/components/content/MainContent';
import { TopRecommendations } from '@/components/home/TopRecommendations';
import { HomepageToggle } from '@/components/home/HomepageToggle';
// Lazy load non-critical components
const OnboardingQuiz = lazy(() => import('@/components/home/OnboardingQuiz').then(m => ({ default: m.OnboardingQuiz })));
const QuickLoanApplicationDialog = lazy(() => import('@/components/finance/QuickLoanApplicationDialog').then(m => ({ default: m.QuickLoanApplicationDialog })));
const EMICalculator = lazy(() => import('@/components/detail/EMICalculator').then(m => ({ default: m.EMICalculator })));
const MobileFilterDrawer = lazy(() => import('@/components/home/MobileFilterDrawer').then(m => ({ default: m.MobileFilterDrawer })));
const MobileSortSheet = lazy(() => import('@/components/home/MobileSortSheet').then(m => ({ default: m.MobileSortSheet })));
const ExitRescueModal = lazy(() => import('@/components/home/ExitRescueModal').then(m => ({ default: m.ExitRescueModal })));
const SmartSections = lazy(() => import('@/components/home/SmartSections').then(m => ({ default: m.SmartSections })));

import { BannerCarousel } from '@/components/home/BannerCarousel';
import { SortDropdown } from '@/components/content/SortDropdown';
import { LocationPermissionBanner } from '@/components/home/LocationPermissionBanner';

import { Filters, Car, SortOption } from '@/types';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dealers } from '@/data/mockData';
import { toast } from 'sonner';
import { InlineLoader } from '@/components/common/PageLoader';
import { CarDetailPage } from '@/pages/CarDetail';
import { useCarListings } from '@/hooks/useCarListings';
import { CarListingWithRelations } from '@/types/car-listing';
import { useDealerProfile } from '@/hooks/useDealerProfile';
import { useCreateEnquiry } from '@/hooks/useEnquiries';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useEventTracking } from '@/hooks/useEventTracking';
import { calculateEMI } from '@/lib/emiCalculator';
import { useFitScore } from '@/hooks/useFitScore';
import { supabase } from '@/integrations/supabase/client';
import { sendUserConfirmation, triggerDealerNotification } from '@/services/whatsappNotifications';
import { ShareDialog } from '@/components/common/ShareDialog';
import { useSavedCars, useAddSavedCar, useRemoveSavedCar } from '@/hooks/useSavedCars';
import { TestDriveBookingDialog } from '@/components/detail/TestDriveBookingDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useBrands } from '@/hooks/useBrands';
import { useIsMobile } from '@/hooks/use-mobile';

// Mobile Components
import { MobileNavbar } from '@/components/layout/MobileNavbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MobileHomeHeader } from '@/components/home/MobileHomeHeader';
import { MobileFilterSheet } from '@/components/filters/MobileFilterSheet';
// MobileFilterDrawer, MobileSortSheet are lazy loaded


const initialFilters: Filters = {
  segment: 'all',
  city: 'All Cities',
  brands: [],
  models: [],
  categories: [],
  years: [],
  fuelTypes: [],
  bodyTypes: [],
  transmissions: [],
  features: [],
  seats: [],
  owners: [],
  kmsDriven: 'any',
  colors: [],
  availability: [],
  searchTerm: '',
};

const Index = () => {
  const navigate = useNavigate();
  const { user, hasRole, roles } = useAuth();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [carToShare, setCarToShare] = useState<Car | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitModalSubmitted, setExitModalSubmitted] = useState(
    localStorage.getItem('exit_modal_submitted') === 'true'
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [useRecommended, setUseRecommended] = useState(
    localStorage.getItem('homepage_mode') !== 'classic'
  );
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [testDriveDialogOpen, setTestDriveDialogOpen] = useState(false);
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [selectedCarForLoan, setSelectedCarForLoan] = useState<Car | null>(null);
  const [emiCalculatorOpen, setEmiCalculatorOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Calculate active filters count for mobile badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.brands.length > 0) count += filters.brands.length;
    if (filters.models.length > 0) count += filters.models.length;
    if (filters.fuelTypes.length > 0) count += filters.fuelTypes.length;
    if (filters.transmissions.length > 0) count += filters.transmissions.length;
    if (filters.years.length > 0) count += filters.years.length;
    if (filters.bodyTypes.length > 0) count += filters.bodyTypes.length;
    if (filters.kmsDriven !== 'any') count += 1;
    if (filters.city !== 'All Cities') count += 1;
    return count;
  }, [filters]);

  const createEnquiry = useCreateEnquiry();
  const { requireAuth } = useAuthGuard();
  const geolocation = useGeolocation();
  const { trackEvent } = useEventTracking();

  // Saved cars hooks
  const { data: savedCars } = useSavedCars();
  const addSavedCar = useAddSavedCar();
  const removeSavedCar = useRemoveSavedCar();

  // Fetch live car listings from database - Reduced initial fetch for faster TTI
  const { data: carListingsData, isLoading } = useCarListings({
    status: 'live',
    pageSize: 12 // Optimized to 12 for mobile performance (95+ target)
  });

  const { data: allBrands = [] } = useBrands();

  // Convert database listings to Car type for UI compatibility
  const databaseCars: Car[] = useMemo(() => {
    if (!carListingsData?.data) return [];

    return carListingsData.data.map((listing: CarListingWithRelations) => {
      const photos = listing.photos as any[];
      const mainPhoto = photos?.[0];
      const carPrice = Number(listing.expected_price);

      // Extract features with full metadata
      const featuresWithMetadata = (listing as any).car_listing_features?.map((f: any) => ({
        id: f.features?.id || '',
        name: f.features?.name || '',
        icon: f.features?.icon || null,
        category: f.features?.category || null,
      })).filter((f: any) => f.name) || [];

      // Create categorizedFeatures
      const categorizedFeatures: Record<string, string[]> = {};
      featuresWithMetadata.forEach((f: any) => {
        const category = f.category || 'Other';
        if (!categorizedFeatures[category]) {
          categorizedFeatures[category] = [];
        }
        categorizedFeatures[category].push(f.name);
      });

      return {
        id: listing.id,
        title: `${listing.brand?.name || ''} ${listing.model?.name || ''} ${listing.variant}`,
        year: listing.year_of_make,
        brand: listing.brand?.name || '',
        model: listing.model?.name || '',
        variant: listing.variant,
        price: carPrice,
        imageUrl: mainPhoto?.url || mainPhoto?.thumbnail_url || '/placeholder.svg',
        kmsDriven: listing.kms_driven,
        fuelType: listing.fuel_type?.name as any || 'Petrol',
        transmission: listing.transmission?.name as any || 'Manual',
        owner: listing.owner_type?.name as any || '1st Owner',
        location: `${listing.city?.name || ''}, ${listing.city?.state || ''}`,
        city: listing.city?.name || '',
        bodyType: listing.body_type?.name || '',
        category: listing.category?.name as any || 'Certified',
        features: featuresWithMetadata.map((f: any) => f.name),
        featuresMetadata: featuresWithMetadata,
        categorizedFeatures: categorizedFeatures,
        seats: listing.seats || 5,
        color: listing.color || '',
        availability: 'In Stock' as any,
        isFeatured: listing.is_featured || false,
        dealerId: listing.seller_id,
        multipleImageUrls: photos?.map(p => p.url || p.thumbnail_url) || [],
        description: listing.description || '',
        reasonsToBuy: listing.highlights || [],
        emiPerMonth: calculateEMI(carPrice),
      } as Car;
    });
  }, [carListingsData]);

  const allCars = databaseCars;

  // Get FitScore for recommendations
  const { data: fitScores = {} } = useFitScore(
    allCars,
    geolocation.latitude && geolocation.longitude
      ? { latitude: geolocation.latitude, longitude: geolocation.longitude }
      : null
  );

  // Calculate counts for segments
  const { allCount, premiumCount } = useMemo(() => {
    const activeLuxuryBrands = allBrands.filter(b => b.is_luxury && b.is_active).map(b => b.name);

    // Base filter (city only) for checking segment counts
    const cityFilteredCars = allCars.filter(car =>
      filters.city === 'All Cities' || car.city === filters.city
    );

    const premium = cityFilteredCars.filter(car => activeLuxuryBrands.includes(car.brand)).length;

    return {
      allCount: cityFilteredCars.length,
      premiumCount: premium
    };
  }, [allCars, allBrands, filters.city]);

  // Filter cars based on all active filters
  const filteredCars = useMemo(() => {
    return allCars.filter((car) => {
      // 1. Segment Filter
      if (filters.segment === 'premium') {
        const activeLuxuryBrands = allBrands.filter(b => b.is_luxury && b.is_active).map(b => b.name);
        if (!activeLuxuryBrands.includes(car.brand)) return false;
      }

      if (filters.city !== 'All Cities' && car.city !== filters.city) return false;
      if (filters.brands.length > 0 && !filters.brands.includes(car.brand)) return false;
      if (filters.models.length > 0 && !filters.models.includes(car.model)) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(car.category)) return false;
      if (filters.years.length > 0 && !filters.years.includes(car.year.toString())) return false;
      if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(car.fuelType)) return false;
      if (filters.bodyTypes.length > 0 && !filters.bodyTypes.includes(car.bodyType)) return false;
      if (filters.transmissions.length > 0 && !filters.transmissions.includes(car.transmission))
        return false;
      if (
        filters.features.length > 0 &&
        !filters.features.every((feature) => car.features.includes(feature))
      )
        return false;
      if (filters.seats.length > 0) {
        const seatMatch = filters.seats.some((s) => {
          const seatNum = parseInt(s);
          return car.seats === seatNum;
        });
        if (!seatMatch) return false;
      }
      if (filters.owners.length > 0 && !filters.owners.includes(car.owner)) return false;
      if (filters.kmsDriven !== 'any') {
        const [min, max] = filters.kmsDriven.split('-').map((v) => (v === '+' ? Infinity : parseInt(v)));
        if (car.kmsDriven < min || (max !== Infinity && car.kmsDriven > max)) return false;
      }
      if (filters.colors.length > 0 && !filters.colors.includes(car.color.toLowerCase()))
        return false;
      if (filters.availability.length > 0 && !filters.availability.includes(car.availability))
        return false;
      // Price range filters
      if (filters.priceMax && car.price > filters.priceMax) return false;
      if (filters.priceMin && car.price < filters.priceMin) return false;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const searchableText = `${car.title} ${car.brand} ${car.model} ${car.variant}`.toLowerCase();
        if (!searchableText.includes(searchLower)) return false;
      }
      return true;
    });
  }, [filters, allCars]);

  // Calculate average car price for loan section
  const averageCarPrice = useMemo(() => {
    if (filteredCars.length === 0) return 500000; // Default 5 lakhs
    const total = filteredCars.reduce((sum, car) => sum + car.price, 0);
    return Math.round(total / filteredCars.length);
  }, [filteredCars]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    trackEvent.mutate({ event: 'filter_change', meta: newFilters });
  };

  const handleClearAll = () => {
    setFilters(initialFilters);
    toast.success('All filters cleared');
  };

  const handleSearch = (term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }));
    trackEvent.mutate({ event: 'search', meta: { term } });
  };

  const handleCallDealer = async (car: Car) => {
    requireAuth(async () => {
      trackEvent.mutate({ event: 'contact_click', car_id: car.id, meta: { type: 'call' } });

      const { data: dealerProfile, error: dealerError } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, phone_number')
        .eq('id', car.dealerId)
        .single();

      if (dealerError || !dealerProfile?.phone_number) {
        toast.error('Dealer contact not available');
        return;
      }

      createEnquiry.mutate({
        carListingId: car.id,
        dealerId: dealerProfile.id,
        enquiryType: 'call',
      }, {
        onSuccess: async (data) => {
          try {
            await sendUserConfirmation(data.user_id, {
              brand: car.brand,
              model: car.model,
              variant: car.variant,
              price: car.price,
              listingId: car.id,
            }, dealerProfile.full_name);

            await triggerDealerNotification(data.id, dealerProfile.id, {
              brand: car.brand,
              model: car.model,
              variant: car.variant,
              price: car.price,
              listingId: car.id,
              photos: [],
            }, {
              name: data.guest_name || 'User',
              phone: data.guest_phone,
              email: data.guest_email,
            });
          } catch (error) {
            console.error('Notification error:', error);
          }

          window.location.href = `tel:${dealerProfile.phone_number}`;
          toast.success(`Calling ${dealerProfile.full_name}`);
        },
        onError: (error) => {
          console.error('Enquiry failed:', error);
          toast.error(`Failed: ${error.message}`);
        },
      });
    }, {
      message: 'Please login to contact the dealer',
      returnTo: window.location.pathname,
    });
  };

  const handleWhatsAppEnquiry = async (car: Car) => {
    requireAuth(async () => {
      trackEvent.mutate({ event: 'contact_click', car_id: car.id, meta: { type: 'whatsapp' } });

      const { data: dealerProfile, error: dealerError } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, phone_number')
        .eq('id', car.dealerId)
        .single();

      if (dealerError || !dealerProfile?.phone_number) {
        toast.error('Dealer contact not available');
        return;
      }

      createEnquiry.mutate({
        carListingId: car.id,
        dealerId: dealerProfile.id,
        enquiryType: 'whatsapp',
      }, {
        onSuccess: () => {
          const message = `Hi, I'm interested in ${car.title} priced at ₹${(car.price / 100000).toFixed(2)} Lakh.`;
          const url = `https://wa.me/${dealerProfile.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
          toast.success('Opening WhatsApp...');
        },
      });
    });
  };

  const handleChat = (car: Car) => {
    trackEvent.mutate({ event: 'contact_click', car_id: car.id, meta: { type: 'chat' } });
    toast.info('Opening chat...');
  };

  const handleBookTestDrive = () => {
    requireAuth(() => {
      if (!selectedCar) return;
      setTestDriveDialogOpen(true);
    }, {
      message: 'Please login to book a test drive',
      returnTo: window.location.pathname,
    });
  };

  const handleApplyForLoan = (car?: Car) => {
    requireAuth(() => {
      // Use provided car or first filtered car for loan application
      const carForLoan = car || filteredCars[0] || null;
      if (!carForLoan) {
        toast.error('No car selected for loan application');
        return;
      }
      setSelectedCarForLoan(carForLoan);
      setLoanDialogOpen(true);

      // Track loan application attempt
      trackEvent.mutate({
        event: 'loan_attempt',
        meta: {
          car_id: carForLoan.id,
          car_brand: carForLoan.brand,
          car_model: carForLoan.model,
          car_price: carForLoan.price,
          from_page: car ? 'car_detail' : 'loan_banner',
          average_price: averageCarPrice,
        },
      });
      trackEvent.mutate({
        event: 'loan_attempt',
        car_id: carForLoan.id,
        meta: {
          from_page: car ? 'car_detail' : 'loan_card',
          average_price: averageCarPrice
        }
      });
    }, {
      message: 'Please login to apply for a car loan',
      returnTo: window.location.pathname,
    });
  };

  const handleOpenEMICalculator = () => {
    setEmiCalculatorOpen(true);
    trackEvent.mutate({
      event: 'click',
      meta: {
        action: 'emi_calculator_opened',
        from_page: 'homepage',
        average_price: averageCarPrice,
      },
    });
  };

  const handleSocialShare = (platform: 'whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'telegram' | 'email') => {
    if (!selectedCar) return;

    const shareUrl = `${window.location.origin}/car/${selectedCar.id}`;
    const shareText = `Check out this ${selectedCar.title} - ₹${(selectedCar.price / 100000).toFixed(2)} Lakh on PickMyCar`;

    let platformUrl = '';

    switch (platform) {
      case 'whatsapp':
        platformUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
        break;
      case 'facebook':
        platformUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareText)}`;
        break;
      case 'instagram':
        navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied!', {
          description: 'Share it on Instagram by pasting the link',
        });
        return;
      case 'twitter':
        platformUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'telegram':
        platformUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'email':
        platformUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`;
        break;
    }

    if (platformUrl) {
      window.open(platformUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleToggleShortlist = (carId: string) => {
    requireAuth(() => {
      const isCurrentlySaved = shortlistedIds.includes(carId);

      if (isCurrentlySaved) {
        // Remove from shortlist
        setShortlistedIds((prev) => prev.filter((id) => id !== carId));
        removeSavedCar.mutate(carId);
        trackEvent.mutate({ event: 'wishlist_remove', car_id: carId });
      } else {
        // Add to shortlist
        setShortlistedIds((prev) => [...prev, carId]);
        addSavedCar.mutate(carId);
        trackEvent.mutate({ event: 'wishlist_add', car_id: carId });
      }
    }, { message: 'Please login to save cars' });
  };

  const handleAuthAction = (action: 'login' | 'dealer-login' | 'register-dealer') => {
    toast.info(`Opening ${action} modal...`);
  };

  const handleNavigate = (view: string) => {
    if (view === 'home') {
      setCurrentView('list');
      setSelectedCarId(null);
    } else if (view === 'sell') {
      navigate('/sell-car');
    } else if (view === 'buy') {
      setCurrentView('list');
      setSelectedCarId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCarClick = (car: Car) => {
    setSelectedCarId(car.id);
    setCurrentView('detail');
    window.scrollTo(0, 0);

    // Track view
    trackEvent.mutate({ event: 'view', car_id: car.id });

    // Store in recently viewed
    const recentlyViewed = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
    const updated = [car.id, ...recentlyViewed.filter((id: string) => id !== car.id)].slice(0, 10);
    localStorage.setItem('recently_viewed', JSON.stringify(updated));
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedCarId(null);
  };

  const handleShare = (car: Car) => {
    setCarToShare(car);
    setShareDialogOpen(true);
  };

  const handleHomepageToggle = (recommended: boolean) => {
    setUseRecommended(recommended);
    localStorage.setItem('homepage_mode', recommended ? 'recommended' : 'classic');
    toast.success(recommended ? 'Switched to Smart View' : 'Switched to Classic View');
  };

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (
        e.clientY <= 0 &&
        currentView === 'list' &&
        user &&                  // Must be logged in
        hasRole('user') &&       // Must have 'user' role
        !exitModalSubmitted      // Not already submitted
      ) {
        setShowExitModal(true);
        trackEvent.mutate({ event: 'exit_intent' });
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [currentView, trackEvent, user, hasRole, exitModalSubmitted]);

  // Load saved cars from database
  useEffect(() => {
    if (savedCars) {
      const ids = savedCars.map((item: any) => item.car_listing_id);
      setShortlistedIds(ids);
    }
  }, [savedCars]);

  // Onboarding for first-time users - CUSTOMERS ONLY
  useEffect(() => {
    const dashboardRoles = ['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection'];
    const hasDashboardAccess = roles.some(role => dashboardRoles.includes(role));

    if (user && !hasDashboardAccess && !localStorage.getItem('onboarding_complete')) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, roles]);

  const selectedCar = selectedCarId ? allCars.find(car => car.id === selectedCarId) : null;
  const { data: dealerProfile, isLoading: isDealerLoading } = useDealerProfile(selectedCar?.dealerId);

  const selectedDealer = dealerProfile ? {
    id: dealerProfile.id,
    name: dealerProfile.dealership_name || dealerProfile.full_name,
    phone: dealerProfile.phone_number || 'N/A',
    city: dealerProfile.city || selectedCar?.city || '',
    rating: 4.5,
    carsCount: 0,
    logo_url: dealerProfile.logo_url || null,
    year_established: dealerProfile.year_established || null,
  } : selectedCar ? {
    id: selectedCar.dealerId || 'unknown',
    name: 'Dealer Information Loading...',
    phone: 'N/A',
    city: selectedCar.city || '',
    rating: 0,
    carsCount: 0,
  } : null;

  if (currentView === 'detail' && selectedCar) {
    return (
      <>
        <CarDetailPage
          car={selectedCar}
          dealer={selectedDealer!}
          isDealerLoading={isDealerLoading}
          allCars={allCars}
          onBack={handleBackToList}
          onCarClick={handleCarClick}
          onCallDealer={handleCallDealer}
          onWhatsAppEnquiry={handleWhatsAppEnquiry}
          onChat={handleChat}
          onToggleShortlist={handleToggleShortlist}
          shortlistedIds={shortlistedIds}
          onNavigate={handleNavigate}
          onSearchSubmit={handleSearch}
          onBookTestDrive={handleBookTestDrive}
          onSocialShare={handleSocialShare}
          onApplyForLoan={handleApplyForLoan}
        />

        {/* Loan Application Dialog */}
        <Suspense fallback={null}>
          <QuickLoanApplicationDialog
            open={loanDialogOpen}
            onOpenChange={setLoanDialogOpen}
            carListingId={selectedCar.id}
            carBrand={selectedCar.brand}
            carModel={selectedCar.model}
            carVariant={selectedCar.variant || ''}
            carPrice={selectedCar.price}
          />
        </Suspense>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onSearch={handleSearch}
        onNavigate={handleNavigate}
        onAuthAction={handleAuthAction}
      />

      {/* Location Permission Banner */}
      {!geolocation.latitude && geolocation.permission !== 'denied' && (
        <LocationPermissionBanner
          onRequestLocation={geolocation.requestLocation}
          onDismiss={() => { }}
        />
      )}

      <ShareDialog
        car={carToShare}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        source="card"
      />

      {/* Mobile Home Header - Professional Sticky Design */}
      <MobileHomeHeader
        carCount={filteredCars.length}
        cityName={filters.city}
        onSearch={(term) => handleFilterChange({ searchTerm: term })}
        onOpenFilters={() => setMobileFilterOpen(true)}
        onOpenSort={() => setMobileSortOpen(true)}
        onCityChange={(city) => handleFilterChange({ city })}
        onQuickFilterChange={(filterKey, filterValue) => {
          // Handle quick filter changes
          if (filterKey === 'priceMax') {
            // Toggle price filter - if same value, clear it
            if (filters.priceMax === filterValue) {
              handleFilterChange({ priceMax: undefined });
            } else {
              handleFilterChange({ priceMax: filterValue });
            }
          } else if (filterKey === 'bodyTypes') {
            if (filters.bodyTypes.includes(filterValue)) {
              handleFilterChange({ bodyTypes: filters.bodyTypes.filter(b => b !== filterValue) });
            } else {
              handleFilterChange({ bodyTypes: [...filters.bodyTypes, filterValue] });
            }
          } else if (filterKey === 'seats') {
            if (filters.seats.includes(filterValue)) {
              handleFilterChange({ seats: filters.seats.filter(s => s !== filterValue) });
            } else {
              handleFilterChange({ seats: [...filters.seats, filterValue] });
            }
          } else if (filterKey === 'transmissions') {
            if (filters.transmissions.includes(filterValue)) {
              handleFilterChange({ transmissions: filters.transmissions.filter(t => t !== filterValue) });
            } else {
              handleFilterChange({ transmissions: [...filters.transmissions, filterValue] });
            }
          }
        }}
        onClearFilters={handleClearAll}
        activeFilters={{
          priceMax: filters.priceMax,
          bodyTypes: filters.bodyTypes,
          seats: filters.seats,
          transmissions: filters.transmissions,
        }}
      />

      {/* Mobile Filter Drawer - Full Screen */}
      <Suspense fallback={null}>
        {mobileFilterOpen && (
          <MobileFilterDrawer
            isOpen={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
            filters={filters}
            onFilterChange={(key, value) => handleFilterChange({ [key]: value })}
            onClearAll={handleClearAll}
            carCount={filteredCars.length}
          />
        )}
      </Suspense>

      {/* Mobile Sort Sheet */}
      <Suspense fallback={null}>
        {mobileSortOpen && (
          <MobileSortSheet
            isOpen={mobileSortOpen}
            onClose={() => setMobileSortOpen(false)}
            value={sortOption}
            onChange={setSortOption}
          />
        )}
      </Suspense>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onSearchClick={() => setMobileFilterOpen(true)} />

      <div className="flex gap-6 lg:gap-8 w-full mx-auto px-4 md:px-6 lg:px-8 max-w-7xl pb-mobile-nav md:pb-0">
        {/* Only render Sidebar on Desktop to avoid massive TBT on mobile (fetches 10+ master hooks) */}
        {!isMobile && isLargeScreen && (
          <Sidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            isOpen={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
            allCount={allCount}
            premiumCount={premiumCount}
            onSegmentChange={(segment) => handleFilterChange({ segment })}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-hidden space-y-6 py-6 md:py-8">
          {/* Universal Marketplace Benefits */}
          <BannerCarousel />

          {/* Sticky Header: Car Count + Sort/Toggle - Hidden on mobile/tablet (MobileHomeHeader handles it) */}
          <div className="sticky top-16 z-30 hidden lg:flex flex-col sm:flex-row items-center justify-between gap-2.5 rounded-lg border border-border bg-card px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <h2 className="text-lg md:text-xl font-semibold">
                {filteredCars.length} Used Cars
              </h2>
            </div>

            <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
              {/* Show sort dropdown only in Classic View */}
              {!useRecommended && (
                <SortDropdown value={sortOption} onChange={setSortOption} />
              )}
              <HomepageToggle
                useRecommended={useRecommended}
                onToggle={handleHomepageToggle}
              />
            </div>
          </div>

          {useRecommended && user ? (
            allCars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4">🚗</div>
                <h3 className="text-2xl font-bold mb-2">No Cars Available</h3>
                <p className="text-muted-foreground mb-6">
                  There are currently no live car listings. Check back soon!
                </p>
              </div>
            ) : (
              <>
                {/* Top Recommendations */}
                <TopRecommendations
                  cars={filteredCars}
                  onCarClick={handleCarClick}
                  onCallDealer={handleCallDealer}
                  onChat={handleChat}
                  onToggleShortlist={handleToggleShortlist}
                  shortlistedIds={shortlistedIds}
                  fitScores={fitScores}
                  isLoading={isLoading}
                />

                {/* Smart Sections */}
                <Suspense fallback={<div className="h-40 flex items-center justify-center"><InlineLoader /></div>}>
                  <SmartSections
                    cars={filteredCars}
                    userLocation={geolocation.latitude && geolocation.longitude
                      ? { latitude: geolocation.latitude, longitude: geolocation.longitude }
                      : null
                    }
                    onCarClick={handleCarClick}
                    onCallDealer={handleCallDealer}
                    onChat={handleChat}
                    onToggleShortlist={handleToggleShortlist}
                    shortlistedIds={shortlistedIds}
                    isLoading={isLoading}
                  />
                </Suspense>
              </>
            )
          ) : (
            allCars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4">🚗</div>
                <h3 className="text-2xl font-bold mb-2">No Cars Available</h3>
                <p className="text-muted-foreground">
                  There are currently no live car listings. Check back soon!
                </p>
              </div>
            ) : (
              <MainContent
                cars={filteredCars}
                city={filters.city}
                onCallDealer={handleCallDealer}
                onChat={handleChat}
                onToggleShortlist={handleToggleShortlist}
                shortlistedIds={shortlistedIds}
                onCarClick={handleCarClick}
                onShare={handleShare}
                onClearFilters={handleClearAll}
                sortOption={sortOption}
                isLoading={isLoading}
                onApplyLoan={() => handleApplyForLoan()}
                onOpenEMICalculator={handleOpenEMICalculator}
                averageCarPrice={averageCarPrice}
                segment={filters.segment}
              />
            )
          )}
        </div>
      </div>

      {/* Exit Rescue Modal */}
      <Suspense fallback={null}>
        {showExitModal && (
          <ExitRescueModal
            open={showExitModal}
            onOpenChange={setShowExitModal}
            onSubmitted={() => setExitModalSubmitted(true)}
          />
        )}
      </Suspense>

      {/* Test Drive Booking Dialog */}
      {selectedCar && (
        <TestDriveBookingDialog
          open={testDriveDialogOpen}
          onOpenChange={setTestDriveDialogOpen}
          carId={selectedCar.id}
          dealerId={selectedCar.dealerId}
          dealerName={selectedDealer?.name || 'Dealer'}
          showroomAddress={(dealerProfile as any)?.address || dealerProfile?.city || selectedCar.city || 'Please contact dealer for address'}
        />
      )}

      {/* Loan Application Dialog */}
      <Suspense fallback={null}>
        {loanDialogOpen && (
          <QuickLoanApplicationDialog
            open={loanDialogOpen}
            onOpenChange={setLoanDialogOpen}
            carListingId={selectedCarForLoan?.id || filteredCars[0]?.id || ''}
            carBrand={selectedCarForLoan?.brand || filteredCars[0]?.brand || ''}
            carModel={selectedCarForLoan?.model || filteredCars[0]?.model || ''}
            carVariant={selectedCarForLoan?.variant || filteredCars[0]?.variant || ''}
            carPrice={selectedCarForLoan?.price || filteredCars[0]?.price || 0}
          />
        )}
      </Suspense>

      {/* EMI Calculator Dialog */}
      <Suspense fallback={null}>
        {emiCalculatorOpen && (
          <Dialog open={emiCalculatorOpen} onOpenChange={setEmiCalculatorOpen}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-none sm:rounded-2xl shadow-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">🧮</span>
                    EMI Calculator
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-1">
                <EMICalculator
                  carPrice={averageCarPrice}
                  onApplyForFinance={() => {
                    setEmiCalculatorOpen(false);
                    handleApplyForLoan();
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Suspense>

      {/* Onboarding Quiz */}
      <Suspense fallback={null}>
        {showOnboarding && (
          <OnboardingQuiz
            open={showOnboarding}
            onOpenChange={setShowOnboarding}
            onComplete={() => {
              setShowOnboarding(false);
              localStorage.setItem('onboarding_complete', 'true');
              toast.success('Welcome! Your personalized feed is ready 🎉', {
                description: 'We will show you cars that match your style'
              });
            }}
          />
        )}
      </Suspense>
    </div>
  );
};

export default Index;
