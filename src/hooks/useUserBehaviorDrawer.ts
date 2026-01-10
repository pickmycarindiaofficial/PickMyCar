import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface BrandAffinity {
  brand: string;
  percentage: number;
  views: number;
}

export interface PriceSensitivity {
  range: string;
  percentage: number;
  views: number;
}

export interface ContactLog {
  type: 'whatsapp' | 'call';
  timestamp: string;
  car_name: string;
}

export interface DealerContactDetail {
  dealer_id: string;
  dealer_name: string;
  whatsapp_count: number;
  call_count: number;
  total_count: number;
  contacts: ContactLog[];
}

export interface ContactActivity {
  whatsapp_clicks: number;
  call_clicks: number;
  total_contacts: number;
  dealers_contacted: DealerContactDetail[];
}

export interface EMIEngagement {
  calculations_count: number;
  cars_with_emi: { car_name: string; price: number; times_calculated: number }[];
  loan_probability: number;
}

export interface CarView {
  car_id: string;
  car_name: string;
  brand: string;
  model: string;
  price: number;
  view_count: number;
  last_viewed: string;
  contacted: boolean;
  emi_calculated: boolean;
  dealer_id: string;
  dealer_name: string;
  dealer_phone?: string;
  dealer_whatsapp?: string;
  contacted_via_whatsapp: boolean;
  contacted_via_call: boolean;
}

export function useUserBehaviorDrawer(userId?: string) {
  return useQuery({
    queryKey: ['user-behavior-drawer', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Fetch user interactions for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: interactions, error } = await (supabase as any)
        .from('user_events')
        .select(`
          *,
          car_listings:car_id(
            id,
            expected_price,
            variant,
            seller_id,
            brand:brand_id(name),
            model:model_id(name)
          )
        `)
        .eq('user_id', userId)
        .gte('at', thirtyDaysAgo.toISOString())
        .order('at', { ascending: false });

      if (error) throw error;

      // Fetch dealer profiles for contacted dealers
      const contactedDealerIds = new Set(
        (interactions || [])
          .filter((i: any) => ['whatsapp_click', 'call_click', 'contact_click'].includes(i.event))
          .map((i: any) => i.car_listings?.seller_id)
          .filter(Boolean)
      );

      const { data: dealerProfiles } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, username')
        .in('id', Array.from(contactedDealerIds));

      const dealerMap = new Map(
        (dealerProfiles || []).map((d: any) => [d.id, d.full_name || d.username])
      );

      // Fetch dealer contact details for car owners
      const carDealerIds = new Set(
        (interactions || [])
          .filter((i: any) => i.event === 'view' && i.car_listings?.seller_id)
          .map((i: any) => i.car_listings.seller_id)
      );

      const { data: dealerContacts } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, username, phone_number')
        .in('id', Array.from(carDealerIds));

      const dealerContactMap = new Map(
        (dealerContacts || []).map((d: any) => [
          d.id, 
          { 
            name: d.full_name || d.username,
            phone: d.phone_number,
            whatsapp: d.phone_number // Assuming phone is same as WhatsApp
          }
        ])
      );

      // Calculate brand affinity
      const brandCounts = new Map<string, number>();
      let totalViews = 0;

      (interactions || []).forEach((interaction: any) => {
        if (interaction.event === 'view' && interaction.car_listings?.brand?.name) {
          const brand = interaction.car_listings.brand.name;
          brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
          totalViews++;
        }
      });

      const brandAffinity: BrandAffinity[] = Array.from(brandCounts.entries())
        .map(([brand, views]) => ({
          brand,
          views,
          percentage: totalViews > 0 ? (views / totalViews) * 100 : 0
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);

      // Calculate model affinity
      const modelCounts = new Map<string, number>();
      (interactions || []).forEach((interaction: any) => {
        if (interaction.event === 'view' && interaction.car_listings?.model?.name) {
          const model = interaction.car_listings.model.name;
          modelCounts.set(model, (modelCounts.get(model) || 0) + 1);
        }
      });

      const modelAffinity = Array.from(modelCounts.entries())
        .map(([model, views]) => ({
          model,
          views,
          percentage: totalViews > 0 ? (views / totalViews) * 100 : 0
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);

      // Calculate price sensitivity
      const priceBands = [
        { range: '≤ ₹6L', min: 0, max: 600000 },
        { range: '₹6-8L', min: 600000, max: 800000 },
        { range: '> ₹8L', min: 800000, max: Infinity }
      ];

      const priceViews = new Map<string, number>();
      (interactions || []).forEach((interaction: any) => {
        if (interaction.event === 'view' && interaction.car_listings?.expected_price) {
          const price = interaction.car_listings.expected_price;
          const band = priceBands.find(b => price >= b.min && price < b.max);
          if (band) {
            priceViews.set(band.range, (priceViews.get(band.range) || 0) + 1);
          }
        }
      });

      const priceSensitivity: PriceSensitivity[] = Array.from(priceViews.entries())
        .map(([range, views]) => ({
          range,
          views,
          percentage: totalViews > 0 ? (views / totalViews) * 100 : 0
        }))
        .sort((a, b) => b.percentage - a.percentage);

      // Calculate contact activity with detailed logs
      const whatsappClicks = (interactions || []).filter((i: any) => i.event === 'whatsapp_click').length;
      const callClicks = (interactions || []).filter((i: any) => i.event === 'call_click').length;

      // Build detailed contact map by dealer
      const dealerContactLogMap = new Map<string, {
        dealer_name: string;
        whatsapp: ContactLog[];
        calls: ContactLog[];
      }>();

      (interactions || [])
        .filter((i: any) => ['whatsapp_click', 'call_click'].includes(i.event))
        .forEach((i: any) => {
          const dealerId = i.car_listings?.seller_id;
          if (!dealerId) return;
          
          const dealerName = (dealerMap.get(dealerId) || 'Unknown Dealer') as string;
          const carName = `${i.car_listings?.brand?.name || ''} ${i.car_listings?.model?.name || ''} ${i.car_listings?.variant || ''}`.trim();
          
          if (!dealerContactLogMap.has(dealerId)) {
            dealerContactLogMap.set(dealerId, {
              dealer_name: dealerName,
              whatsapp: [],
              calls: []
            });
          }
          
          const dealer = dealerContactLogMap.get(dealerId)!;
          const log: ContactLog = {
            type: i.event === 'whatsapp_click' ? 'whatsapp' : 'call',
            timestamp: i.at,
            car_name: carName
          };
          
          if (i.event === 'whatsapp_click') {
            dealer.whatsapp.push(log);
          } else {
            dealer.calls.push(log);
          }
        });

      const contactActivity: ContactActivity = {
        whatsapp_clicks: whatsappClicks,
        call_clicks: callClicks,
        total_contacts: whatsappClicks + callClicks,
        dealers_contacted: Array.from(dealerContactLogMap.entries())
          .map(([dealerId, data]) => ({
            dealer_id: dealerId,
            dealer_name: data.dealer_name,
            whatsapp_count: data.whatsapp.length,
            call_count: data.calls.length,
            total_count: data.whatsapp.length + data.calls.length,
            contacts: [...data.whatsapp, ...data.calls].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
          }))
          .sort((a, b) => b.total_count - a.total_count)
          .slice(0, 10)
      };

      // Calculate EMI engagement
      const emiCalculations = (interactions || []).filter((i: any) => i.event === 'emi_calculation');
      const emiByCarMap = new Map<string, { name: string; price: number; count: number }>();
      
      emiCalculations.forEach((i: any) => {
        const carId = i.car_id;
        if (carId && i.car_listings) {
          const carName = `${i.car_listings.brand?.name || ''} ${i.car_listings.model?.name || ''} ${i.car_listings.variant || ''}`.trim();
          const existing = emiByCarMap.get(carId);
          if (existing) {
            existing.count++;
          } else {
            emiByCarMap.set(carId, {
              name: carName,
              price: i.car_listings.expected_price || 0,
              count: 1
            });
          }
        }
      });

      const emiEngagement: EMIEngagement = {
        calculations_count: emiCalculations.length,
        cars_with_emi: Array.from(emiByCarMap.values())
          .map(car => ({
            car_name: car.name,
            price: car.price,
            times_calculated: car.count
          }))
          .sort((a, b) => b.times_calculated - a.times_calculated)
          .slice(0, 5),
        loan_probability: emiCalculations.length > 5 ? 85 : emiCalculations.length > 2 ? 65 : emiCalculations.length > 0 ? 40 : 15
      };

      // Get car views aggregated by car
      const carViewMap = new Map<string, any>();
      (interactions || [])
        .filter((i: any) => i.event === 'view' && i.car_listings)
        .forEach((i: any) => {
          const carId = i.car_id;
          const existing = carViewMap.get(carId);
          if (existing) {
            existing.view_count++;
            if (new Date(i.at) > new Date(existing.last_viewed)) {
              existing.last_viewed = i.at;
            }
          } else {
            const dealerId = i.car_listings.seller_id;
            const dealerInfo = dealerContactMap.get(dealerId) as { name: string; phone?: string; whatsapp?: string } | undefined;
            const dealerName = dealerInfo?.name || 'Unknown Dealer';
            
            carViewMap.set(carId, {
              car_id: carId,
              car_name: `${i.car_listings.brand?.name || ''} ${i.car_listings.model?.name || ''} ${i.car_listings.variant || ''}`.trim(),
              brand: i.car_listings.brand?.name || '',
              model: `${i.car_listings.model?.name || ''} ${i.car_listings.variant || ''}`.trim(),
              price: i.car_listings.expected_price || 0,
              view_count: 1,
              last_viewed: i.at,
              contacted: false,
              contacted_via_whatsapp: false,
              contacted_via_call: false,
              emi_calculated: false,
              dealer_id: dealerId,
              dealer_name: dealerName,
              dealer_phone: dealerInfo?.phone,
              dealer_whatsapp: dealerInfo?.whatsapp
            });
          }
        });

      // Mark contacted cars with specific contact methods
      (interactions || [])
        .filter((i: any) => i.event === 'whatsapp_click')
        .forEach((i: any) => {
          const car = carViewMap.get(i.car_id);
          if (car) {
            car.contacted = true;
            car.contacted_via_whatsapp = true;
          }
        });

      (interactions || [])
        .filter((i: any) => i.event === 'call_click')
        .forEach((i: any) => {
          const car = carViewMap.get(i.car_id);
          if (car) {
            car.contacted = true;
            car.contacted_via_call = true;
          }
        });

      emiCalculations.forEach((i: any) => {
        const car = carViewMap.get(i.car_id);
        if (car) car.emi_calculated = true;
      });

      const carViews: CarView[] = Array.from(carViewMap.values())
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 10);

      // Fetch AI suggestions for this user
      const { data: suggestions } = await (supabase as any)
        .from('ai_suggestions')
        .select('*')
        .eq('target_id', userId)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .limit(5);

      return {
        brandAffinity,
        modelAffinity,
        priceSensitivity,
        contactActivity,
        emiEngagement,
        carViews,
        aiSuggestions: suggestions || []
      };
    },
    enabled: !!userId,
    refetchInterval: 60000
  });
}
