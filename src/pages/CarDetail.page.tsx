import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCarListingById } from '@/hooks/useCarListingById';
import { useDealerProfile } from '@/hooks/useDealerProfile';
import { CarDetailPage } from './CarDetail';
import { Car } from '@/types';
import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useCreateEnquiry } from '@/hooks/useEnquiries';
import { sendUserConfirmation, triggerDealerNotification } from '@/services/whatsappNotifications';
import { ShareDialog } from '@/components/common/ShareDialog';
import { calculateEMI } from '@/lib/emiCalculator';
import { TestDriveBookingDialog } from '@/components/detail/TestDriveBookingDialog';
import { QuickLoanApplicationDialog } from '@/components/finance/QuickLoanApplicationDialog';

export function CarDetailRoute() {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireAuth } = useAuthGuard();
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [testDriveDialogOpen, setTestDriveDialogOpen] = useState(false);
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const createEnquiry = useCreateEnquiry();


  // Fetch single car listing by ID - OPTIMIZED
  const { data: carListing, isLoading: carsLoading } = useCarListingById(carId);

  // Process single car listing into Car format with feature metadata
  const selectedCar = useMemo(() => {
    if (!carListing) return null;

    const listing = carListing as any;

    // Extract features with full metadata (icon, category)
    const featuresWithMetadata = listing.car_listing_features?.map((f: any) => ({
      id: f.features?.id || '',
      name: f.features?.name || '',
      icon: f.features?.icon || null,
      category: f.features?.category || null,
    })).filter((f: any) => f.name) || [];

    // Create categorizedFeatures for DetailsTabs component
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
      title: `${listing.brands?.name || ''} ${listing.models?.name || ''} ${listing.variant || ''}`.trim(),
      year: listing.year_of_make,
      brand: listing.brands?.name || '',
      model: listing.models?.name || '',
      variant: listing.variant || '',
      price: Number(listing.expected_price),
      imageUrl: listing.photos?.[0]?.medium_url || listing.photos?.[0]?.url || '/placeholder.svg',
      multipleImageUrls: listing.photos?.map((p: any) => p.url) || [],
      kmsDriven: listing.kms_driven,
      fuelType: listing.fuel_types?.name || 'Petrol',
      transmission: listing.transmissions?.name || 'Manual',
      owner: listing.owner_types?.name || '1st Owner',
      location: listing.cities?.name || '',
      city: listing.cities?.name || '',
      bodyType: listing.body_types?.name || '',
      category: listing.car_categories?.name || 'Certified',
      features: listing.car_listing_features?.map((f: any) => f.features?.name).filter(Boolean) || [],
      featuresMetadata: featuresWithMetadata,
      categorizedFeatures: categorizedFeatures,
      seats: listing.seats || 5,
      color: listing.color || '',
      availability: 'In Stock',
      dealerId: listing.seller_id,
      description: listing.description || '',
      reasonsToBuy: listing.highlights || [],
      emiPerMonth: calculateEMI(Number(listing.expected_price)),
    } as Car;
  }, [carListing]);

  // Fetch dealer profile - with authentication awareness
  const { data: dealerProfile, isLoading: dealerLoading } = useDealerProfile(
    selectedCar?.dealerId
  );

  // Map dealer profile to Dealer type with auth-gated phone and additional info
  const dealer = useMemo(() => {
    if (!dealerProfile) return null;

    return {
      id: dealerProfile.id,
      name: dealerProfile.dealership_name || dealerProfile.full_name,
      phone: user ? (dealerProfile.phone_number || '') : '', // Only show phone if logged in
      city: dealerProfile.city || '',
      rating: 4.5,
      carsCount: 0,
      logo_url: dealerProfile.logo_url || null,
      year_established: dealerProfile.year_established || null,
    };
  }, [dealerProfile, user]);

  const handleCallDealer = async (car: Car) => {
    requireAuth(async () => {
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
            await sendUserConfirmation(
              data.user_id,
              {
                brand: car.brand,
                model: car.model,
                variant: car.variant,
                price: car.price,
                listingId: car.id,
              },
              dealerProfile.full_name
            );

            await triggerDealerNotification(
              data.id,
              dealerProfile.id,
              {
                brand: car.brand,
                model: car.model,
                variant: car.variant,
                price: car.price,
                listingId: car.id,
                photos: [],
              },
              {
                name: data.guest_name || 'User',
                phone: data.guest_phone,
                email: data.guest_email,
              }
            );
          } catch (error) {
            console.error('Notification error:', error);
          }

          window.location.href = `tel:${dealerProfile.phone_number}`;
          toast.success(`Calling ${dealerProfile.full_name}`, {
            description: `Phone: ${dealerProfile.phone_number}`,
          });
        },
        onError: (error) => {
          console.error('Error creating enquiry:', error);
          toast.error('Failed to track enquiry');
        },
      });
    }, {
      message: 'Please login to contact the dealer',
      returnTo: window.location.pathname,
    });
  };

  const handleWhatsAppEnquiry = async (car: Car) => {
    requireAuth(async () => {
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
        onSuccess: (data) => {
          const message = `Hi, I'm interested in ${car.title} priced at ₹${(car.price / 100000).toFixed(2)} Lakh. Can you provide more details?`;
          const whatsappUrl = `https://wa.me/${dealerProfile.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
          toast.success('Opening WhatsApp...', {
            description: `Contacting ${dealerProfile.full_name}`,
          });
        },
        onError: (error) => {
          console.error('Error creating enquiry:', error);
          toast.error('Failed to track enquiry');
        },
      });
    }, {
      message: 'Please login to contact the dealer',
      returnTo: window.location.pathname,
    });
  };

  const handleChat = (car: Car) => {
    toast.info('Opening chat...', {
      description: `Starting conversation about ${car.title}`,
    });
  };

  const handleToggleShortlist = (carId: string) => {
    setShortlistedIds((prev) => {
      if (prev.includes(carId)) {
        toast.info('Removed from shortlist');
        return prev.filter((id) => id !== carId);
      } else {
        toast.success('Added to shortlist');
        return [...prev, carId];
      }
    });
  };

  const handleNavigate = (view: string) => {
    if (view === 'home') {
      navigate('/');
    } else {
      toast.info(`Navigating to ${view}...`);
    }
  };

  const handleCarClick = (car: Car) => {
    navigate(`/car/${car.id}`);
    window.scrollTo(0, 0);
  };

  const handleBackToList = () => {
    navigate(-1);
  };

  const handleBookTestDrive = () => {
    if (!selectedCar?.id) {
      toast.error('Car information missing. Please refresh the page.');
      return;
    }

    if (!dealer?.id) {
      toast.error('Dealer information not available. Please try again.');
      return;
    }

    if (!dealer?.name) {
      toast.error('Dealer information incomplete. Please refresh the page.');
      return;
    }

    setTestDriveDialogOpen(true);
  };

  const handleApplyForLoan = () => {
    setLoanDialogOpen(true);
  };

  const handleSocialShare = (platform: 'whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'telegram' | 'email') => {
    if (!selectedCar) return;

    const shareUrl = window.location.href;
    const shareText = `Check out this ${selectedCar.title} - ₹${(selectedCar.price / 100000).toFixed(2)} Lakh on PickMyCar`;

    let platformUrl = '';

    switch (platform) {
      case 'whatsapp':
        platformUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
        break;
      case 'facebook':
        platformUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, copy to clipboard instead
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

  const handleSearch = (term: string) => {
    navigate(`/?search=${encodeURIComponent(term)}`);
  };

  // Loading state
  if (carsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not found state
  if (!selectedCar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Car Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The car you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const ogTitle = selectedCar ? `${selectedCar.title} – ₹${(selectedCar.price / 100000).toFixed(2)} Lakh` : 'PickMyCar';
  const ogDescription = selectedCar
    ? `${selectedCar.year} • ${selectedCar.transmission} • ${selectedCar.fuelType} • ${selectedCar.kmsDriven.toLocaleString()} km | ${selectedCar.location}`
    : 'Find your perfect used car';

  // Use car's medium image if available (absolute URL check)
  const ogImage = (() => {
    if (selectedCar?.imageUrl && selectedCar.imageUrl.startsWith('http')) {
      return selectedCar.imageUrl;
    }
    // Fallback to logo in public folder
    return `${window.location.origin}/logo.png`;
  })();

  const ogUrl = window.location.href;

  return (
    <>
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="title" content={ogTitle} />
        <meta name="description" content={ogDescription} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={selectedCar?.title} />
        <meta property="og:site_name" content="PickMyCar" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:updated_time" content={new Date().toISOString()} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={ogUrl} />
        <meta property="twitter:title" content={ogTitle} />
        <meta property="twitter:description" content={ogDescription} />
        <meta property="twitter:image" content={ogImage} />

        {/* WhatsApp/Telegram optimization */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={ogUrl} />
      </Helmet>

      <ShareDialog
        car={selectedCar}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        source="detail"
      />

      <TestDriveBookingDialog
        open={testDriveDialogOpen && !!selectedCar}
        onOpenChange={setTestDriveDialogOpen}
        carId={selectedCar?.id || ''}
        dealerId={selectedCar?.dealerId || ''}
        dealerName={dealerProfile?.dealership_name || dealerProfile?.full_name || 'Dealer'}
        showroomAddress={(dealerProfile as any)?.address || dealerProfile?.city || 'Please contact dealer for address'}
      />

      <QuickLoanApplicationDialog
        open={loanDialogOpen}
        onOpenChange={setLoanDialogOpen}
        carListingId={selectedCar?.id || ''}
        carBrand={selectedCar?.brand || ''}
        carModel={selectedCar?.model || ''}
        carVariant={selectedCar?.variant || ''}
        carPrice={selectedCar?.price || 0}
      />

      <CarDetailPage
        car={selectedCar}
        dealer={dealer!}
        isDealerLoading={dealerLoading}
        allCars={[selectedCar]}
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
    </>
  );
}

export default CarDetailRoute;
