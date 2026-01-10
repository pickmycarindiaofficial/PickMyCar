import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Starting Market Intelligence Analysis...');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. TRENDING BRANDS - Most viewed in last 7 days
    console.log('📊 Analyzing trending brands...');
    const { data: currentBrandViews } = await supabase
      .from('car_listings')
      .select('brand_id, brands(name), view_count')
      .gte('updated_at', sevenDaysAgo.toISOString())
      .eq('status', 'live');

    const { data: previousBrandViews } = await supabase
      .from('car_listings')
      .select('brand_id, view_count')
      .gte('updated_at', fourteenDaysAgo.toISOString())
      .lt('updated_at', sevenDaysAgo.toISOString())
      .eq('status', 'live');

    // Aggregate by brand
    const brandMetrics = new Map();
    currentBrandViews?.forEach((listing: any) => {
      const brandId = listing.brand_id;
      const current = brandMetrics.get(brandId) || { 
        name: listing.brands?.name, 
        current: 0, 
        previous: 0 
      };
      current.current += listing.view_count || 0;
      brandMetrics.set(brandId, current);
    });

    previousBrandViews?.forEach((listing: any) => {
      const brandId = listing.brand_id;
      const current = brandMetrics.get(brandId) || { 
        current: 0, 
        previous: 0 
      };
      current.previous += listing.view_count || 0;
      brandMetrics.set(brandId, current);
    });

    // Insert trending brand signals
    for (const [brandId, metrics] of brandMetrics.entries()) {
      if (metrics.current > 50) { // Only track if significant views
        const change = metrics.previous > 0 
          ? ((metrics.current - metrics.previous) / metrics.previous) * 100 
          : 100;

        await supabase.from('market_signals').insert({
          signal_type: 'trending_brand',
          entity_type: 'brand',
          entity_id: brandId,
          entity_name: metrics.name || 'Unknown Brand',
          metric_value: metrics.current,
          previous_value: metrics.previous,
          change_percentage: change,
          trend_direction: change > 10 ? 'up' : change < -10 ? 'down' : 'stable',
          confidence_score: Math.min(95, 70 + (metrics.current / 100)),
          priority: change > 50 ? 90 : change > 25 ? 70 : 50,
          time_period: 'last_7_days',
          expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // 2. HOT LOCATIONS - Cities with highest demand
    console.log('📍 Analyzing hot locations...');
    const { data: cityDemand } = await supabase
      .from('car_enquiries')
      .select('car_listing_id, car_listings(city_id, cities(name))')
      .gte('created_at', sevenDaysAgo.toISOString());

    const cityMetrics = new Map();
    cityDemand?.forEach((enquiry: any) => {
      const cityId = enquiry.car_listings?.city_id;
      const cityName = enquiry.car_listings?.cities?.name;
      if (cityId) {
        cityMetrics.set(cityId, {
          name: cityName,
          count: (cityMetrics.get(cityId)?.count || 0) + 1
        });
      }
    });

    for (const [cityId, metrics] of cityMetrics.entries()) {
      if (metrics.count > 5) {
        await supabase.from('market_signals').insert({
          signal_type: 'hot_location',
          entity_type: 'city',
          entity_id: cityId,
          entity_name: metrics.name || 'Unknown City',
          metric_value: metrics.count,
          trend_direction: 'up',
          confidence_score: 85,
          priority: metrics.count > 20 ? 95 : 75,
          time_period: 'last_7_days',
          expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // 3. INVENTORY GAPS - Detailed analysis combining searches + enquiries
    console.log('🔎 Analyzing inventory gaps with search and enquiry data...');
    
    // Get search events from user_events
    const { data: searchEvents } = await supabase
      .from('user_events')
      .select('meta')
      .eq('event', 'search')
      .gte('at', sevenDaysAgo.toISOString());

    // Get unmet enquiries (enquiries without dealer response)
    const { data: unmetEnquiries } = await supabase
      .from('car_enquiries')
      .select('car_listing_id, car_listings(brand_id, model_id, brands(id, name), models(id, name))')
      .eq('status', 'new')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get all live inventory for comparison
    const { data: liveInventory } = await supabase
      .from('car_listings')
      .select('brand_id, model_id, brands(id, name), models(id, name)')
      .eq('status', 'live');

    // Aggregate search data by brand+model
    const searchMetrics = new Map<string, { brand: string; brandId: string; model: string; modelId: string; count: number }>();
    
    searchEvents?.forEach((event: any) => {
      const brandName = event.meta?.brand;
      const modelName = event.meta?.model;
      if (brandName) {
        const key = `${brandName}-${modelName || 'any'}`;
        const existing = searchMetrics.get(key) || { 
          brand: brandName, 
          brandId: '', 
          model: modelName || '', 
          modelId: '', 
          count: 0 
        };
        existing.count++;
        searchMetrics.set(key, existing);
      }
    });

    // Aggregate unmet enquiries by brand+model
    const enquiryMetrics = new Map<string, { brand: string; brandId: string; model: string; modelId: string; count: number }>();
    
    unmetEnquiries?.forEach((enquiry: any) => {
      const brandName = enquiry.car_listings?.brands?.name;
      const brandId = enquiry.car_listings?.brands?.id;
      const modelName = enquiry.car_listings?.models?.name;
      const modelId = enquiry.car_listings?.models?.id;
      
      if (brandName) {
        const key = `${brandName}-${modelName || 'any'}`;
        const existing = enquiryMetrics.get(key) || { 
          brand: brandName, 
          brandId: brandId || '', 
          model: modelName || '', 
          modelId: modelId || '', 
          count: 0 
        };
        existing.count++;
        enquiryMetrics.set(key, existing);
      }
    });

    // Create inventory index for quick lookup
    const inventoryIndex = new Set<string>();
    liveInventory?.forEach((listing: any) => {
      const brandName = listing.brands?.name;
      const modelName = listing.models?.name;
      if (brandName) {
        inventoryIndex.add(`${brandName}-${modelName || 'any'}`);
      }
    });

    // Combine search + enquiry data and identify gaps
    const inventoryGaps: any[] = [];
    const allKeys = new Set([...searchMetrics.keys(), ...enquiryMetrics.keys()]);

    allKeys.forEach(key => {
      // Skip if we have inventory for this brand+model
      if (inventoryIndex.has(key)) return;

      const searchData = searchMetrics.get(key) || { brand: '', brandId: '', model: '', modelId: '', count: 0 };
      const enquiryData = enquiryMetrics.get(key) || { brand: '', brandId: '', model: '', modelId: '', count: 0 };

      const searchCount = searchData.count;
      const unmetCount = enquiryData.count;
      const totalDemand = searchCount + unmetCount;

      // Only include if there's significant demand
      if (totalDemand < 3) return;

      // Calculate demand score (weighted: searches 60%, unmet leads 40%)
      const maxDemand = Math.max(...Array.from(allKeys).map(k => {
        const s = searchMetrics.get(k)?.count || 0;
        const e = enquiryMetrics.get(k)?.count || 0;
        return s + e;
      }));
      
      const demandScore = Math.min(100, Math.round(
        ((searchCount * 0.6 + unmetCount * 0.4) / (maxDemand * 0.6 + maxDemand * 0.4)) * 100
      ));

      // Determine urgency
      let urgency = 'low';
      if (demandScore >= 80) urgency = 'high';
      else if (demandScore >= 50) urgency = 'medium';

      // Build suggestions
      const suggestions: string[] = [];
      if (unmetCount > 0) {
        suggestions.push(`${unmetCount} buyers waiting`);
      }
      if (searchCount > 5) {
        suggestions.push(`${searchCount} searches this week`);
      }
      suggestions.push('Source from partner dealers');
      suggestions.push('Notify interested buyers');

      inventoryGaps.push({
        id: key,
        brand: searchData.brand || enquiryData.brand,
        brand_id: searchData.brandId || enquiryData.brandId,
        model: searchData.model || enquiryData.model,
        model_id: searchData.modelId || enquiryData.modelId,
        search_count: searchCount,
        unmet_lead_count: unmetCount,
        total_demand: totalDemand,
        demand_score: demandScore,
        urgency,
        suggestions: suggestions.join(' • ')
      });
    });

    // Sort by demand score descending
    inventoryGaps.sort((a, b) => {
      if (b.demand_score !== a.demand_score) {
        return b.demand_score - a.demand_score;
      }
      return b.total_demand - a.total_demand;
    });

    console.log(`✅ Found ${inventoryGaps.length} inventory gaps`);

    // Store top gaps as market signals
    inventoryGaps.slice(0, 5).forEach(async (gap) => {
      await supabase.from('market_signals').insert({
        signal_type: 'inventory_gap',
        entity_type: 'brand_model',
        entity_id: gap.brand_id,
        entity_name: `${gap.brand} ${gap.model}`.trim(),
        metric_value: gap.total_demand,
        trend_direction: 'up',
        confidence_score: 90,
        priority: gap.urgency === 'high' ? 95 : gap.urgency === 'medium' ? 75 : 60,
        metadata: {
          search_count: gap.search_count,
          unmet_lead_count: gap.unmet_lead_count,
          demand_score: gap.demand_score,
          suggestions: gap.suggestions
        },
        time_period: 'last_7_days',
        expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    });

    // 4. PRICE TRENDS - Detect price changes
    console.log('💰 Analyzing price trends...');
    const { data: priceTrends } = await supabase
      .from('car_listings')
      .select('model_id, models(name), expected_price')
      .eq('status', 'live')
      .gte('updated_at', sevenDaysAgo.toISOString());

    const modelPrices = new Map();
    priceTrends?.forEach((listing: any) => {
      const modelId = listing.model_id;
      if (!modelPrices.has(modelId)) {
        modelPrices.set(modelId, {
          name: listing.models?.name,
          prices: []
        });
      }
      modelPrices.get(modelId).prices.push(listing.expected_price);
    });

    for (const [modelId, data] of modelPrices.entries()) {
      if (data.prices.length > 5) {
        const avgPrice = data.prices.reduce((a: number, b: number) => a + b, 0) / data.prices.length;
        const maxPrice = Math.max(...data.prices);
        const minPrice = Math.min(...data.prices);
        const variance = ((maxPrice - minPrice) / avgPrice) * 100;

        if (variance > 15) {
          await supabase.from('market_signals').insert({
            signal_type: 'price_trend',
            entity_type: 'model',
            entity_id: modelId,
            entity_name: data.name || 'Unknown Model',
            metric_value: avgPrice,
            trend_direction: 'stable',
            confidence_score: 80,
            priority: 60,
            metadata: {
              avg_price: avgPrice,
              min_price: minPrice,
              max_price: maxPrice,
              variance: variance
            },
            time_period: 'last_7_days',
            expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
    }

    console.log('✅ Market Intelligence Analysis Complete!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Market intelligence analysis completed',
        signals_generated: {
          trending_brands: brandMetrics.size,
          hot_locations: cityMetrics.size,
          inventory_gaps: inventoryGaps.length,
          price_trends: modelPrices.size
        },
        inventory_gaps: inventoryGaps
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Market Intelligence Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
