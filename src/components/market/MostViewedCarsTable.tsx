import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageSquare, Calendar, User, ExternalLink } from 'lucide-react';
import { MostViewedCar, useMostViewedCars } from '@/hooks/useMostViewedCars';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBrands } from '@/hooks/useBrands';
import { formatDistanceToNow } from 'date-fns';

interface MostViewedCarsTableProps {
  onCarClick: (carId: string) => void;
}

export function MostViewedCarsTable({ onCarClick }: MostViewedCarsTableProps) {
  const [brandFilter, setBrandFilter] = useState<string>('');
  const { data: cars, isLoading } = useMostViewedCars(brandFilter || undefined);
  const { data: brands } = useBrands();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Viewed Cars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Most Viewed Cars</CardTitle>
            <CardDescription>Top performing listings with engagement metrics</CardDescription>
          </div>
          <Select value={brandFilter || 'all'} onValueChange={(value) => setBrandFilter(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands?.map((brand) => (
                <SelectItem key={brand.id} value={brand.name}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Car</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Views</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Leads</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Test Drives</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Posted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Dealer</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {cars?.slice(0, 10).map((car, index) => (
                  <tr key={car.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {car.brand} {car.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {car.year} • {car.variant}
                        </p>
                        <p className="text-xs font-semibold text-primary">
                          ₹{(car.price / 100000).toFixed(2)}L
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{car.view_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{car.enquiry_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={car.test_drive_count > 0 ? 'default' : 'outline'} className="text-xs">
                        {car.test_drive_count}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(car.published_at), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{car.dealer_name}</span>
                      </div>
                      {car.dealer_city && (
                        <p className="text-xs text-muted-foreground">{car.dealer_city}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCarClick(car.id)}
                        className="h-8"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {(!cars || cars.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No cars found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
