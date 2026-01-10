import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useAddSavedCar } from '@/hooks/useSavedCars';
import { Navbar } from '@/components/layout/Navbar';
import { ShareDialog } from '@/components/common/ShareDialog';
import { Car } from '@/types';

export default function RecommendedCars() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [carToShare, setCarToShare] = useState<Car | null>(null);
  const { data: recommendations, isLoading } = useRecommendations();
  const addToSaved = useAddSavedCar();

  const handleSave = (e: React.MouseEvent, carId: string) => {
    e.stopPropagation();
    addToSaved.mutate(carId);
  };

  const handleShare = (e: React.MouseEvent, car: any) => {
    e.stopPropagation();
    const photos = Array.isArray(car.photos) ? car.photos : [];
    const transformedCar: Car = {
      id: car.id,
      title: `${car.brands?.name} ${car.models?.name}`,
      year: car.year_of_make,
      brand: car.brands?.name || '',
      model: car.models?.name || '',
      variant: car.variant || '',
      price: Number(car.expected_price),
      imageUrl: photos[0] || '/placeholder.svg',
      kmsDriven: car.kms_driven || 0,
      fuelType: car.fuel_types?.name || 'Petrol',
      transmission: car.transmissions?.name || 'Manual',
      owner: car.owner_types?.name || '1st Owner',
      location: car.cities?.name || '',
      city: car.cities?.name || '',
      bodyType: car.body_types?.name || '',
      category: car.car_categories?.name || 'Non Warranty',
      features: [],
      seats: car.seats || 5,
      color: car.color || '',
      availability: 'In Stock',
      isFeatured: car.is_featured || false,
      dealerId: car.seller_id,
      multipleImageUrls: photos,
    };
    setCarToShare(transformedCar);
    setShareDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={setSearchTerm} onNavigate={(view) => navigate(view === 'home' ? '/' : `/${view}`)} />
      
      <ShareDialog 
        car={carToShare} 
        open={shareDialogOpen} 
        onOpenChange={setShareDialogOpen}
        source="card"
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Recommended For You</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Personalized car recommendations based on your preferences
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading recommendations...</div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((car: any) => {
              const photos = Array.isArray(car.photos) ? car.photos : [];
              
              return (
                <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {photos[0] ? (
                      <img
                        src={photos[0]}
                        alt={`${car.brands?.name} ${car.models?.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onClick={() => navigate(`/car/${car.id}`)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => handleShare(e, car)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => handleSave(e, car.id)}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4" onClick={() => navigate(`/car/${car.id}`)}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {car.brands?.name} {car.models?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {car.year_of_make} • {car.kms_driven?.toLocaleString()} km
                        </p>
                      </div>
                      <Badge variant="secondary">{car.fuel_types?.name}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-2xl font-bold text-primary">
                        ₹{car.expected_price?.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">{car.cities?.name}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No recommendations yet</h3>
            <p className="text-muted-foreground mb-6">
              Browse and save some cars to get personalized recommendations
            </p>
            <Button onClick={() => navigate('/')}>Browse Cars</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
