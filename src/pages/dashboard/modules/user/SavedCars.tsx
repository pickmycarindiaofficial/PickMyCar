import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, MessageSquare, Trash2 } from 'lucide-react';

export default function SavedCars() {
  const savedCars = [
    {
      id: '1',
      name: 'Honda City 2023',
      price: '₹12,50,000',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
      location: 'Delhi',
      year: '2023',
      km: '15,000',
      fuel: 'Petrol',
      transmission: 'Manual',
      savedDate: '2025-01-15',
    },
    {
      id: '2',
      name: 'Maruti Swift 2024',
      price: '₹7,80,000',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400',
      location: 'Mumbai',
      year: '2024',
      km: '5,000',
      fuel: 'Petrol',
      transmission: 'Automatic',
      savedDate: '2025-01-14',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Saved Cars</h1>
        <p className="text-muted-foreground text-lg">
          Your shortlisted vehicles
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Heart className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{savedCars.length}</p>
              <p className="text-sm text-muted-foreground">Saved Cars</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Eye className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">24</p>
              <p className="text-sm text-muted-foreground">Cars Viewed</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <MessageSquare className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Enquiries Sent</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Heart className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Test Drives</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {savedCars.map((car) => (
          <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={car.image}
                alt={car.name}
                className="w-full h-48 object-cover"
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2"
              >
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              </Button>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{car.name}</h3>
                <p className="text-2xl font-bold text-primary">{car.price}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{car.year}</Badge>
                <Badge variant="secondary">{car.km} km</Badge>
                <Badge variant="secondary">{car.fuel}</Badge>
                <Badge variant="secondary">{car.transmission}</Badge>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
                <Button variant="outline" size="icon">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
