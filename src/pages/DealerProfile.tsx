import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useDealerFullProfile } from '@/hooks/useDealerFullProfile';
import { Navbar } from '@/components/layout/Navbar';
import { DealerHeroSection } from '@/components/dealer/DealerHeroSection';
import { DealerTrustBadges } from '@/components/dealer/DealerTrustBadges';
import { DealerAboutSection } from '@/components/dealer/DealerAboutSection';
import { DealerInventoryGrid } from '@/components/dealer/DealerInventoryGrid';
import { DealerContactCard } from '@/components/dealer/DealerContactCard';
import { DealerMapLocation } from '@/components/dealer/DealerMapLocation';
import { DealerCustomerPhotos } from '@/components/dealer/DealerCustomerPhotos';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DealerProfile() {
  const { dealerId } = useParams<{ dealerId: string }>();
  const navigate = useNavigate();
  const { requireAuth } = useAuthGuard();
  const { data: dealer, isLoading, error } = useDealerFullProfile(dealerId);

  const handleCallDealer = () => {
    requireAuth(() => {
      if (dealer?.phone_number) {
        window.location.href = `tel:${dealer.phone_number}`;
        toast.success('Calling dealer...');
      } else {
        toast.error('Phone number not available');
      }
    });
  };

  const handleWhatsAppEnquiry = () => {
    requireAuth(() => {
      if (dealer?.phone_number) {
        const message = encodeURIComponent(
          `Hi ${dealer.dealership_name}, I'm interested in the cars available at your showroom. Can you provide more details?`
        );
        window.open(`https://wa.me/${dealer.phone_number.replace(/\D/g, '')}?text=${message}`, '_blank');
        toast.success('Opening WhatsApp...');
      } else {
        toast.error('WhatsApp contact not available');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onSearch={() => {}} onNavigate={() => {}} />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading dealer profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dealer) {
    const errorMessage = (error as any)?.message || 'Dealer not found';
    const isPermissionError = errorMessage.includes('permission') || 
                              errorMessage.includes('policy') ||
                              errorMessage.includes('row-level security') ||
                              (error as any)?.code === 'PGRST116';
    
    return (
      <div className="min-h-screen bg-background">
        <Navbar onSearch={() => {}} onNavigate={() => {}} />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-4">
              {isPermissionError ? 'Login Required' : 'Dealer Not Found'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isPermissionError 
                ? 'You need to log in to view dealer profiles and contact information.'
                : 'The dealer profile you\'re looking for doesn\'t exist or has been removed.'
              }
            </p>
            <div className="flex gap-3 justify-center">
              {isPermissionError && (
                <Button onClick={() => navigate(`/auth?returnTo=${window.location.pathname}`)}>
                  Login to View Profile
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: dealer.dealership_name,
    image: dealer.logo_url || dealer.avatar_url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: dealer.address,
      addressLocality: dealer.city,
      addressRegion: dealer.state,
      postalCode: dealer.pincode,
      addressCountry: 'IN',
    },
    telephone: dealer.phone_number,
    aggregateRating: dealer.google_rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: dealer.google_rating,
          reviewCount: dealer.google_review_count || 0,
        }
      : undefined,
  };

  return (
    <>
      <Helmet>
        <title>{`${dealer.dealership_name} - Used Cars in ${dealer.city} | PickMyCar`}</title>
        <meta
          name="description"
          content={`${dealer.dealership_name} offers quality used cars in ${dealer.city}, ${dealer.state}. ${
            dealer.year_established ? `${new Date().getFullYear() - dealer.year_established}+ years experience. ` : ''
          }Browse ${dealer.active_listings} available cars. ${dealer.google_rating ? `Rated ${dealer.google_rating}/5. ` : ''}Contact: ${dealer.phone_number}`}
        />
        <meta
          name="keywords"
          content={`used cars ${dealer.city}, ${dealer.dealership_name}, second hand cars ${dealer.state}, pre-owned cars, car dealer ${dealer.city}`}
        />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${dealer.dealership_name} - Used Cars in ${dealer.city}`} />
        <meta
          property="og:description"
          content={`Browse ${dealer.active_listings} quality used cars from ${dealer.dealership_name}. ${
            dealer.google_rating ? `Rated ${dealer.google_rating}/5. ` : ''
          }Contact now!`}
        />
        <meta property="og:image" content={dealer.logo_url || dealer.banner_url || ''} />
        <meta property="og:type" content="business.business" />
        
        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar onSearch={() => {}} onNavigate={() => {}} />

        <div className="container mx-auto px-4 py-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Compact Hero Section */}
          <DealerHeroSection
            dealer={dealer}
            onCallClick={handleCallDealer}
            onWhatsAppClick={handleWhatsAppEnquiry}
          />

          {/* Compact Trust Badges */}
          <div className="mt-4">
            <DealerTrustBadges dealer={dealer} />
          </div>

          {/* Collapsible About Section */}
          <div className="mt-4">
            <DealerAboutSection dealer={dealer} />
          </div>

          {/* Main Content Grid - Prioritize Inventory */}
          <div className="mt-4 grid lg:grid-cols-3 gap-4">
            {/* Inventory - Takes 2 columns, appears first */}
            <div className="lg:col-span-2 order-1">
              <DealerInventoryGrid dealerId={dealer.id} />
            </div>

            {/* Compact Sidebar - Takes 1 column */}
            <div className="space-y-4 order-2">
              {/* Customer Photos - Above contact card */}
              {dealer.show_customer_photos !== false && dealer.customer_photos && (
                <DealerCustomerPhotos photos={dealer.customer_photos} />
              )}
              
              {/* Contact Card */}
              <DealerContactCard
                dealer={dealer}
                onCallClick={handleCallDealer}
                onWhatsAppClick={handleWhatsAppEnquiry}
              />
              
              {/* Map Location */}
              <DealerMapLocation dealer={dealer} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
