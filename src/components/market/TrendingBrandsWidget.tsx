import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Search, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TrendingItem {
  id: string;
  name: string;
  count: number;
}

interface TrendingBrandsWidgetProps {
  brands: {
    bySearches: TrendingItem[];
    byViews: TrendingItem[];
  };
}

export function TrendingBrandsWidget({ brands }: TrendingBrandsWidgetProps) {
  const hasData = brands.bySearches.length > 0 || brands.byViews.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trending Brands</CardTitle>
          <CardDescription>Most popular brands this week</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No trending data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Brands
        </CardTitle>
        <CardDescription>Top brands by searches and views</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* By Searches Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Search className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">By Searches</h4>
            </div>
            {brands.bySearches.slice(0, 8).map((brand, index) => (
              <div key={brand.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium text-sm">{brand.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {brand.count}
                </span>
              </div>
            ))}
          </div>

          {/* By Views Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">By Views</h4>
            </div>
            {brands.byViews.slice(0, 8).map((brand, index) => (
              <div key={brand.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium text-sm">{brand.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {brand.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
