import { Car } from '@/types';
import { CarCard } from '@/components/content/CarCard';
import { Loader2, Sparkles } from 'lucide-react';
import { parsePhotos } from '@/lib/photoUtils';

interface SimilarCarsSectionProps {
  cars: any[];
  isLoading: boolean;
  onCallDealer: (car: Car) => void;
  onChat: (car: Car) => void;
  onToggleShortlist: (carId: string) => void;
  shortlistedIds: string[];
  onCardClick: (car: Car) => void;
  onShare: (car: Car) => void;
}

export function SimilarCarsSection({
  cars,
  isLoading,
  onCallDealer,
  onChat,
  onToggleShortlist,
  shortlistedIds,
  onCardClick,
  onShare,
}: SimilarCarsSectionProps) {
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
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold">Cars Similar to Your Saved Vehicles</h2>
        </div>
        <p className="text-muted-foreground text-lg">
          Based on your preferences, we think you'll love these options
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cars.map((listing) => {
          const car = transformCarData(listing);
          return (
            <CarCard
              key={car.id}
              car={car}
              onCallDealer={onCallDealer}
              onChat={onChat}
              onToggleShortlist={onToggleShortlist}
              isShortlisted={shortlistedIds.includes(car.id)}
              onCardClick={onCardClick}
              onShare={onShare}
            />
          );
        })}
      </div>
    </section>
  );
}
