import { useState } from 'react';
import { Car, Dealer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, MessageCircle, Building2, MapPin, TrendingUp, Car as CarIcon, Mail } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Link } from 'react-router-dom';
import { DealerContactLock } from './DealerContactLock';
import { useAuth } from '@/contexts/AuthContext';
import { TestDriveBookingDialog } from './TestDriveBookingDialog';
import { ExistingBookingDialog } from './ExistingBookingDialog';
import { useExistingTestDriveBooking } from '@/hooks/useExistingTestDriveBooking';

interface CarInfoCardProps {
  car: Car;
  dealer?: Dealer | null;
  dealerLoading?: boolean;
  onWhatsAppClick: () => void;
  onCallClick: () => void;
  onApplyForLoan: () => void;
  onBookTestDrive: () => void;
  onSocialShare: (platform: 'whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'telegram' | 'email') => void;
}

export function CarInfoCard({
  car,
  dealer,
  dealerLoading,
  onWhatsAppClick,
  onCallClick,
  onApplyForLoan,
  onBookTestDrive,
  onSocialShare,
}: CarInfoCardProps) {
  const { requireAuth } = useAuthGuard();
  const { user } = useAuth();
  const [freeTestDriveOpen, setFreeTestDriveOpen] = useState(false);
  const [existingBookingDialogOpen, setExistingBookingDialogOpen] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);

  // Check for existing booking
  const { data: existingBooking } = useExistingTestDriveBooking(car.id);

  const handleWhatsAppClick = () => {
    requireAuth(() => {
      onWhatsAppClick();
    }, {
      message: 'Please login to enquire via WhatsApp',
      returnTo: window.location.pathname,
    });
  };

  const handleCallClick = () => {
    requireAuth(() => {
      onCallClick();
    }, {
      message: 'Please login to call the dealer',
      returnTo: window.location.pathname,
    });
  };

  const handleApplyForLoan = () => {
    requireAuth(() => {
      onApplyForLoan();
    }, {
      message: 'Please login to apply for a loan',
      returnTo: window.location.pathname,
    });
  };

  const handleBookTestDrive = () => {
    requireAuth(() => {
      onBookTestDrive();
    }, {
      message: 'Please login to book a test drive',
      returnTo: window.location.pathname,
    });
  };

  const handleFreeTestDrive = () => {
    requireAuth(() => {
      // Check if user already has a booking for this car
      if (existingBooking) {
        setExistingBookingDialogOpen(true);
      } else {
        setTimeout(() => {
          setFreeTestDriveOpen(true);
        }, 50);
      }
    }, {
      message: 'Please login to book a free test drive',
      returnTo: window.location.pathname,
    });
  };

  const handleEditExisting = () => {
    setExistingBookingDialogOpen(false);
    setShowEditMode(true);
    setTimeout(() => {
      setFreeTestDriveOpen(true);
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Price Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Price</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                ₹{(car.price / 100000).toFixed(2)} L
              </span>
              {car.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ₹{(car.originalPrice / 100000).toFixed(2)} L
                </span>
              )}
            </div>

            {/* Monthly EMI Display */}
            {car.emiPerMonth && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Monthly EMI</p>
                <p className="text-xl font-semibold text-foreground">
                  ₹{car.emiPerMonth.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  @ 10% for 5 years (approx.)
                </p>
              </div>
            )}
          </div>

          {/* Key Highlights - HIDDEN ON MOBILE & TABLET, VISIBLE ON DESKTOP */}
          {car.reasonsToBuy && car.reasonsToBuy.length > 0 && (
            <div className="hidden lg:block pt-4 border-t space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Key Highlights
              </h3>
              <ul className="space-y-2">
                {car.reasonsToBuy.map((reason, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons - Always Visible */}
      <div className="space-y-3">
        <Button
          onClick={handleApplyForLoan}
          className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          style={{ backgroundColor: '#236ceb' }}
          size="lg"
        >
          Apply for Loan
        </Button>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleBookTestDrive();
          }}
          className="w-full text-black font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-[#FFD54F]"
          style={{ backgroundColor: '#FFC107' }}
          size="lg"
        >
          <CarIcon className="h-5 w-5 mr-2" />
          Book Test Drive
        </Button>

        {/* NEW: Direct Free Test Drive Button - Green */}
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFreeTestDrive();
          }}
          className="w-full text-white font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-green-700"
          style={{ backgroundColor: '#22c55e' }}
          size="lg"
        >
          <CarIcon className="h-5 w-5 mr-2" />
          Book a Free Test Drive
        </Button>


        <Button
          onClick={handleWhatsAppClick}
          variant="secondary"
          className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          size="lg"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Enquire via WhatsApp
        </Button>
        <Button
          onClick={handleCallClick}
          variant="outline"
          className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-accent"
          style={{ borderColor: '#236ceb', color: '#236ceb' }}
          size="lg"
        >
          <Phone className="h-5 w-5 mr-2" />
          Call Dealer
        </Button>

        {/* Social Share Icons */}
        <div className="pt-2">
          <p className="text-sm text-muted-foreground mb-3 text-center">Share this car</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onSocialShare('whatsapp')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              style={{ backgroundColor: '#25D366' }}
              aria-label="Share on WhatsApp"
            >
              <MessageCircle className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={() => onSocialShare('facebook')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              style={{ backgroundColor: '#1877F2' }}
              aria-label="Share on Facebook"
            >
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              onClick={() => onSocialShare('instagram')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
              aria-label="Share on Instagram"
            >
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </button>
            <button
              onClick={() => onSocialShare('twitter')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              style={{ backgroundColor: '#1DA1F2' }}
              aria-label="Share on Twitter"
            >
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </button>
            <button
              onClick={() => onSocialShare('telegram')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              style={{ backgroundColor: '#0088cc' }}
              aria-label="Share on Telegram"
            >
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </button>
            <button
              onClick={() => onSocialShare('email')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              style={{ backgroundColor: '#6B7280' }}
              aria-label="Share via Email"
            >
              <Mail className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Dealer Information - Auth Gated */}
      {!user ? (
        <DealerContactLock />
      ) : dealerLoading ? (
        <Card className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </Card>
      ) : dealer ? (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {/* Dealer Logo */}
              {(dealer as any).logo_url ? (
                <img
                  src={(dealer as any).logo_url}
                  alt={dealer.name}
                  className="w-16 h-16 rounded-lg object-cover border-2 border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-border">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}

              {/* Dealer Info */}
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Sold by</p>
                <Link
                  to={`/dealer/${dealer.id}`}
                  className="font-semibold text-base hover:text-primary transition-colors flex items-center gap-2"
                >
                  {dealer.name}
                </Link>
                <div className="mt-2 space-y-1">
                  {dealer.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {dealer.city}
                    </p>
                  )}
                  {(dealer as any).year_established && (
                    <p className="text-xs text-muted-foreground">
                      In business since {(dealer as any).year_established}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* View Full Profile Link */}
            <Link
              to={`/dealer/${dealer.id}`}
              className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
            >
              View Full Profile →
            </Link>
          </div>
        </Card>
      ) : null}

      {/* Existing Booking Confirmation Dialog */}
      {existingBooking && (
        <ExistingBookingDialog
          open={existingBookingDialogOpen}
          onOpenChange={setExistingBookingDialogOpen}
          booking={existingBooking}
          onEdit={handleEditExisting}
          onCancel={() => setExistingBookingDialogOpen(false)}
        />
      )}

      {/* Test Drive Booking Dialog */}
      {dealer?.id && (
        <TestDriveBookingDialog
          open={freeTestDriveOpen}
          onOpenChange={(open) => {
            setFreeTestDriveOpen(open);
            if (!open) setShowEditMode(false);
          }}
          carId={car.id}
          dealerId={dealer.id}
          dealerName={dealer.name}
          showroomAddress={dealer.city || 'Showroom Location'}
          editMode={showEditMode}
          existingBooking={existingBooking}
        />
      )}
    </div>
  );
}
