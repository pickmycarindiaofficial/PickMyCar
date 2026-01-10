import { Car } from '@/types';
import { CarCard } from '@/components/content/CarCard';
import { Loader2, TrendingUp, Flame, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { parsePhotos } from '@/lib/photoUtils';

interface TrendingCarsSectionProps {
  cars: any[];
  isLoading: boolean;
  onCallDealer: (car: Car) => void;
  onChat: (car: Car) => void;
  onToggleShortlist: (carId: string) => void;
  shortlistedIds: string[];
  onCardClick: (car: Car) => void;
  onShare: (car: Car) => void;
}

export function TrendingCarsSection({
  cars,
  isLoading,
  onCallDealer,
  onChat,
  onToggleShortlist,
  shortlistedIds,
  onCardClick,
  onShare,
}: TrendingCarsSectionProps) {
  if (isLoading) {
    return (
      <section className="my-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (!cars || cars.length === 0) {
    return null;
  }

  const transformCarData = (listing: any): Car => {
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
      availability: 'In Stock',
      isFeatured: listing.is_featured || false,
      dealerId: listing.seller_id || '',
      sellerId: listing.seller_id || '',
      reasonsToBuy: listing.highlights || [],
    };
  };

  return (
    <section className="my-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Flame className="w-7 h-7 text-orange-500 animate-pulse" />
            <TrendingUp className="w-4 h-4 text-red-500 absolute -top-1 -right-1" />
          </div>
          <h2 className="text-3xl font-bold">Trending Cars - Most Viewed This Week</h2>
        </div>
        <p className="text-muted-foreground text-lg">
          High demand vehicles that other buyers are checking out
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cars.map((listing, index) => {
          const car = transformCarData(listing);
          const isTopTrending = index < 3;
          
          return (
            <div key={car.id} className="relative">
              {/* Top Trending Badge */}
              {isTopTrending && (
                <div className="absolute -top-3 -right-3 z-10">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg px-3 py-1">
                    <Flame className="w-3 h-3 mr-1" />
                    Hot #{index + 1}
                  </Badge>
                </div>
              )}
              
              <CarCard
                car={car}
                onCallDealer={onCallDealer}
                onChat={onChat}
                onToggleShortlist={onToggleShortlist}
                isShortlisted={shortlistedIds.includes(car.id)}
                onCardClick={onCardClick}
                onShare={onShare}
              />
              
              {/* View Count Badge */}
              {listing.view_count > 50 && (
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  <span>{listing.view_count.toLocaleString()} views</span>
                  {listing.enquiry_count > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-orange-500 font-medium">
                        {listing.enquiry_count} enquiries today
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
