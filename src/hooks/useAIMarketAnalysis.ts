import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

interface FastMover {
  id: string;
  car_name: string;
  brand: string;
  model: string;
  views: number;
  enquiries: number;
  conversion_rate: number;
  days_listed: number;
}

interface TrendShift {
  brand: string;
  model?: string;
  change_percentage: number;
  direction: 'up' | 'down';
  previous_week_views: number;
  current_week_views: number;
}

interface Forecast {
  brand: string;
  model: string;
  predicted_demand: 'high' | 'medium' | 'low';
  confidence: number;
  reason: string;
}

interface LoanHotspot {
  brand: string;
  model: string;
  loan_enquiries: number;
  total_enquiries: number;
  loan_percentage: number;
  avg_price: number;
}

export interface AIMarketAnalysis {
  fastMovers: FastMover[];
  trendShifts: TrendShift[];
  forecasts: Forecast[];
  loanHotspots: LoanHotspot[];
}

export function useAIMarketAnalysis(days: number = 14) {
  return useQuery({
    queryKey: ['ai-market-analysis', days],
    queryFn: async (): Promise<AIMarketAnalysis> => {
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 1. FAST MOVERS - High conversion rate cars (>3%)
      const { data: listings, error: listingsError } = await (supabase as any)
        .from('car_listings')
        .select(`
          id,
          variant,
          view_count,
          enquiry_count,
          published_at,
          brands(name),
          models(name)
        `)
        .eq('status', 'live')
        .gte('published_at', startDate.toISOString())
        .gt('view_count', 10);

      if (listingsError) throw listingsError;

      const fastMovers: FastMover[] = (listings || [])
        .map((car: any) => {
          const views = car.view_count || 0;
          const enquiries = car.enquiry_count || 0;
          const conversion_rate = views > 0 ? (enquiries / views) * 100 : 0;
          const days_listed = Math.ceil(
            (now.getTime() - new Date(car.published_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            id: car.id,
            car_name: `${car.brands?.name || ''} ${car.models?.name || ''} ${car.variant || ''}`.trim(),
            brand: car.brands?.name || 'Unknown',
            model: car.models?.name || 'Unknown',
            views,
            enquiries,
            conversion_rate,
            days_listed,
          };
        })
        .filter(car => car.conversion_rate >= 3)
        .sort((a, b) => b.conversion_rate - a.conversion_rate)
        .slice(0, 5);

      // 2. TREND SHIFTS - Week-over-week view changes
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data: currentWeekViews, error: currentError } = await (supabase as any)
        .from('user_events')
        .select('car_id, car_listings!inner(brand_id, model_id, brands(name), models(name))')
        .eq('event', 'view')
        .gte('at', oneWeekAgo.toISOString());

      const { data: previousWeekViews, error: previousError } = await (supabase as any)
        .from('user_events')
        .select('car_id, car_listings!inner(brand_id, model_id, brands(name), models(name))')
        .eq('event', 'view')
        .gte('at', twoWeeksAgo.toISOString())
        .lt('at', oneWeekAgo.toISOString());

      if (currentError) throw currentError;
      if (previousError) throw previousError;


      // Aggregate by brand+model
      const aggregateViews = (data: any[]) => {
        const map = new Map<string, { brand: string; model: string; count: number }>();
        data?.forEach(event => {
          const brand = event.car_listings?.brands?.name;
          const model = event.car_listings?.models?.name;
          if (brand && model) {
            const key = `${brand}|${model}`;
            const existing = map.get(key) || { brand, model, count: 0 };
            existing.count += 1;
            map.set(key, existing);
          }
        });
        return map;
      };

      const currentMap = aggregateViews(currentWeekViews || []);
      const previousMap = aggregateViews(previousWeekViews || []);

      const trendShifts: TrendShift[] = [];
      currentMap.forEach((current, key) => {
        const previous = previousMap.get(key);
        if (previous && previous.count > 0) {
          const change = ((current.count - previous.count) / previous.count) * 100;
          if (Math.abs(change) >= 25) {
            trendShifts.push({
              brand: current.brand,
              model: current.model,
              change_percentage: Math.round(change),
              direction: change > 0 ? 'up' : 'down',
              previous_week_views: previous.count,
              current_week_views: current.count,
            });
          }
        }
      });

      trendShifts.sort((a, b) => Math.abs(b.change_percentage) - Math.abs(a.change_percentage));

      // 3. FORECASTS - Simple prediction based on recent trends
      const forecasts: Forecast[] = trendShifts.slice(0, 5).map(shift => {
        let predicted_demand: 'high' | 'medium' | 'low' = 'medium';
        let confidence = 50;

        if (shift.direction === 'up' && shift.change_percentage > 50) {
          predicted_demand = 'high';
          confidence = 75;
        } else if (shift.direction === 'up' && shift.change_percentage > 25) {
          predicted_demand = 'medium';
          confidence = 65;
        } else if (shift.direction === 'down') {
          predicted_demand = 'low';
          confidence = 60;
        }

        return {
          brand: shift.brand,
          model: shift.model || '',
          predicted_demand,
          confidence,
          reason: `${shift.direction === 'up' ? 'Rising' : 'Declining'} interest (${Math.abs(shift.change_percentage)}% ${shift.direction === 'up' ? 'increase' : 'decrease'})`,
        };
      });

      // 4. LOAN HOTSPOTS - Cars with high loan enquiry percentage
      const { data: allEnquiries, error: enquiriesError } = await (supabase as any)
        .from('car_enquiries')
        .select(`
          enquiry_type,
          car_listing_id,
          car_listings!inner(brand_id, model_id, expected_price, brands(name), models(name))
        `)
        .gte('created_at', startDate.toISOString());

      if (enquiriesError) throw enquiriesError;

      const loanMap = new Map<string, {
        brand: string;
        model: string;
        loan: number;
        total: number;
        prices: number[];
      }>();

      allEnquiries?.forEach((enq: any) => {
        const brand = enq.car_listings?.brands?.name;
        const model = enq.car_listings?.models?.name;
        const price = enq.car_listings?.expected_price;

        if (brand && model) {
          const key = `${brand}|${model}`;
          const existing = loanMap.get(key) || { brand, model, loan: 0, total: 0, prices: [] };
          existing.total += 1;
          if (enq.enquiry_type === 'loan' || enq.enquiry_type === 'test_drive_with_loan') {
            existing.loan += 1;
          }
          if (price) {
            existing.prices.push(price);
          }
          loanMap.set(key, existing);
        }
      });

      const loanHotspots: LoanHotspot[] = Array.from(loanMap.entries())
        .map(([_, data]) => ({
          brand: data.brand,
          model: data.model,
          loan_enquiries: data.loan,
          total_enquiries: data.total,
          loan_percentage: data.total > 0 ? (data.loan / data.total) * 100 : 0,
          avg_price: data.prices.length > 0
            ? data.prices.reduce((a, b) => a + b, 0) / data.prices.length
            : 0,
        }))
        .filter(h => h.loan_percentage >= 30 && h.total_enquiries >= 3)
        .sort((a, b) => b.loan_percentage - a.loan_percentage)
        .slice(0, 5);

      return {
        fastMovers,
        trendShifts: trendShifts.slice(0, 5),
        forecasts,
        loanHotspots,
      };
    },
    refetchInterval: 600000, // 10 minutes
  });
}
