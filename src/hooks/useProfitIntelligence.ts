import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDealerCostProfile } from './useDealerCostProfile';
import { useCarListings } from './useCarListings';
import { useMarketSignals } from './useMarketSignals';
import { DecisionEngine, StrategicAction } from '@/services/profit-engine/DecisionEngine';
import { CarEconomicProfile } from '@/types/profit-intelligence';
import { supabase } from '@/lib/supabase-client';

/**
 * Orchestrates the Profit Intelligence Layer.
 * Replaces the mock AI suggestions by calculating real deterministic Strategic Actions.
 */
export function useProfitIntelligence() {
    const { user } = useAuth();
    const decisionEngine = new DecisionEngine();

    const [actions, setActions] = useState<StrategicAction[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);

    // 1. Fetch live inventory
    const { data: listingsData, isLoading: listingsLoading } = useCarListings({ seller_id: user?.id });

    // 2. Fetch dealer baseline cost profile
    const { data: dealerCost, isLoading: costLoading } = useDealerCostProfile();

    // 3. Fetch real market signals (demand)
    const { signals, isLoading: signalsLoading } = useMarketSignals('all');

    useEffect(() => {
        async function calculateQueue() {
            if (!user || !listingsData?.data || !dealerCost || listingsData.data.length === 0) return;

            setIsCalculating(true);
            try {
                // Fetch all economic profiles for this dealer's cars
                const { data: economicProfiles } = await supabase
                    .from('car_economic_profile')
                    .select('*')
                    .eq('dealer_id', user.id);

                const profilesMap = new Map((economicProfiles || []).map(p => [p.car_id, p as CarEconomicProfile]));
                const generatedActions: StrategicAction[] = [];

                // Run the math engine against every car in inventory
                for (const car of listingsData.data) {
                    // If the car doesn't have an economic profile yet, we skip profit calculations for it
                    const economicProfile = profilesMap.get(car.id);
                    if (!economicProfile) continue;

                    // Days on market calculation
                    const listDate = new Date(car.created_at);
                    const daysOnMarket = Math.floor((Date.now() - listDate.getTime()) / (1000 * 60 * 60 * 24));

                    // Mocking Lead Velocity (In Phase 5 this will pull from the leads table directly)
                    // For now, assume 1 lead roughly every 3 days.
                    const mockLeadVelocity = 0.3;

                    // Find market avg price (Simplified logic: grab from market signals if it matches, else 0)
                    const marketSignal = signals.find(s => s.make === car.brand?.name && s.model === car.model?.name);
                    const avgMarketPrice = marketSignal?.average_price || car.price; // Fallback to current price if no data
                    const priceDeviationPercent = avgMarketPrice > 0 ? ((car.price - avgMarketPrice) / avgMarketPrice) * 100 : 0;
                    const demandScore = marketSignal ? (marketSignal.demand_trend === 'up' ? 90 : 50) : 50;

                    const action = decisionEngine.generateActionQueue(
                        economicProfile,
                        dealerCost,
                        {
                            days_on_market: Math.max(0, daysOnMarket),
                            lead_velocity: mockLeadVelocity,
                            price_deviation_percent: priceDeviationPercent,
                            segment_demand_score: demandScore
                        },
                        car.price,
                        avgMarketPrice
                    );

                    if (action) {
                        // Attach car title for UI rendering
                        generatedActions.push({
                            ...action,
                            car_title: `${car.year_of_make || ''} ${car.brand?.name || ''} ${car.model?.name || ''}`.trim()
                        } as any);
                    }
                }

                // Sort by highest impact first
                generatedActions.sort((a, b) => b.impact_score - a.impact_score);
                setActions(generatedActions);
            } catch (err) {
                console.error("Failed to run profit engine calculations:", err);
            } finally {
                setIsCalculating(false);
            }
        }

        if (!listingsLoading && !costLoading && !signalsLoading) {
            calculateQueue();
        }
    }, [user, listingsData, dealerCost, signals, listingsLoading, costLoading, signalsLoading]);

    return {
        actions,
        isLoading: listingsLoading || costLoading || signalsLoading || isCalculating,
    };
}
