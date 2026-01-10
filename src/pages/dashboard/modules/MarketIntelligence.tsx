import { useState } from 'react';
import { useTrendingData } from '@/hooks/useTrendingData';
import { useInventoryGaps } from '@/hooks/useInventoryGaps';
import { TrendingBrandsWidget } from '@/components/market/TrendingBrandsWidget';
import { TrendingModelsWidget } from '@/components/market/TrendingModelsWidget';
import { MostViewedCarsTable } from '@/components/market/MostViewedCarsTable';
import { CarDetailSheet } from '@/components/market/CarDetailSheet';
import { DealerTrendsSection } from '@/components/market/DealerTrendsSection';
import { InventoryGapAlerts } from '@/components/market/InventoryGapAlerts';
import { AIAnalysisSection } from '@/components/market/AIAnalysisSection';
import { MarketFilters, MarketFiltersState } from '@/components/market/MarketFilters';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function MarketIntelligence() {
  const [filters, setFilters] = useState<MarketFiltersState>({ days: 7, brand: '' });
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: trendingData, isLoading: trendingLoading } = useTrendingData(filters.days);
  const { data: inventoryGaps, isLoading: gapsLoading } = useInventoryGaps({ dateRange: filters.days.toString() });

  const isLoading = trendingLoading || gapsLoading;

  const handleCarClick = (carId: string) => {
    setSelectedCarId(carId);
    setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!trendingData) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No market data available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Market Intelligence</h1>
          <p className="text-muted-foreground">Real-time market trends and opportunities</p>
        </div>
        <MarketFilters filters={filters} onFilterChange={setFilters} />
      </div>

      {/* Row 1: Trending Brands + Trending Models */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendingBrandsWidget brands={trendingData.trendingBrands} />
        <TrendingModelsWidget models={trendingData.trendingModels} />
      </div>

      {/* Row 2: Most Viewed Cars Table */}
      <MostViewedCarsTable onCarClick={handleCarClick} />

      {/* Row 3: Dealer Trends */}
      <DealerTrendsSection />

      {/* Row 4: Critical Inventory Gaps */}
      <InventoryGapAlerts gaps={inventoryGaps || []} isLoading={gapsLoading} />

      {/* Row 5: AI Analysis Pro */}
      <AIAnalysisSection />

      {/* Side Panel */}
      <CarDetailSheet 
        carId={selectedCarId} 
        open={sheetOpen} 
        onClose={() => setSheetOpen(false)} 
      />
    </div>
  );
}
