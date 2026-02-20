import { CarEconomicProfile, DealerCostProfile } from '@/types/profit-intelligence';

export interface PricingSimulationResult {
    price_drop: number;
    new_margin: number;
    predicted_lead_increase: number; // percentage
    predicted_days_saved: number;
    net_profit_impact: number; // Positive means dropping price actually makes more money (due to holding cost savings)
}

export class PricingEngine {
    /**
     * Simulates price drops to find the optimal band without destroying profitability.
     */
    public simulatePriceDrops(
        profile: CarEconomicProfile,
        dealerCost: DealerCostProfile,
        currentPrice: number,
        avgMarketPrice: number
    ): PricingSimulationResult[] {
        const simulationSteps = [5000, 10000, 20000, 50000]; // Fixed rupee drops to simulate
        const results: PricingSimulationResult[] = [];

        // Daily burn rate = physical holding cost + opportunity cost of capital
        const currentDailyBurn = profile.daily_holding_cost + ((profile.acquisition_cost * (dealerCost.cost_of_capital_percentage / 100)) / 365);

        for (const drop of simulationSteps) {
            if (drop > profile.expected_margin) continue; // Never suggest losing money entirely

            // Simplified Elasticity Model: Every 1% drop below market average increases leads by 1.5% 
            const currentDeviationPercent = ((currentPrice - avgMarketPrice) / avgMarketPrice) * 100;
            const proposedDeviationPercent = (((currentPrice - drop) - avgMarketPrice) / avgMarketPrice) * 100;

            const leadIncreasePercent = Math.max(0, (currentDeviationPercent - proposedDeviationPercent) * 1.5);

            // Assume a 15% lead increase saves 5 days on market (calibration point)
            const daysSaved = (leadIncreasePercent / 15) * 5;

            const holdingCostSaved = daysSaved * currentDailyBurn;

            // Did saving time offset the pure price drop?
            const netProfitImpact = holdingCostSaved - drop;

            results.push({
                price_drop: drop,
                new_margin: profile.expected_margin - drop,
                predicted_lead_increase: leadIncreasePercent,
                predicted_days_saved: daysSaved,
                net_profit_impact: netProfitImpact
            });
        }

        return results;
    }
}
