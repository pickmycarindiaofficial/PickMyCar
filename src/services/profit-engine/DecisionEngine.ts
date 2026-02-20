import { InventoryEngine, InventoryMetrics } from './InventoryEngine';
import { CapitalEngine } from './CapitalEngine';
import { PricingEngine } from './PricingEngine';
import { CarEconomicProfile, DealerCostProfile } from '@/types/profit-intelligence';

export interface StrategicAction {
    car_id: string;
    action_type: 'reduce_price' | 'liquidate' | 'improve_photos' | 'hold';
    urgency: number; // 0-100
    impact_score: number;
    expected_profit_gain: number;
    recommendation_text: string;
}

export class DecisionEngine {
    private inventoryEngine = new InventoryEngine();
    private capitalEngine = new CapitalEngine();
    private pricingEngine = new PricingEngine();

    public generateActionQueue(
        profile: CarEconomicProfile,
        dealerCost: DealerCostProfile,
        inventoryMetrics: InventoryMetrics,
        currentPrice: number,
        avgMarketPrice: number
    ): StrategicAction | null {
        const healthScore = this.inventoryEngine.calculateHealthScore(inventoryMetrics, profile);
        const healthStatus = this.inventoryEngine.getInventoryStatus(healthScore);
        const trueROI = this.capitalEngine.calculateTrueROI(profile, dealerCost, inventoryMetrics.days_on_market);

        // If health is great and ROI is high, we Hold.
        if (healthStatus === 'Healthy' && trueROI > 0) return null;

        // LIQUIDATE scenario: Holding cost is literally killing the margin
        if (healthStatus === 'Dead Capital' || trueROI < -5) {
            return {
                car_id: profile.car_id,
                action_type: 'liquidate',
                urgency: 95,
                impact_score: Math.abs(trueROI) * 10, // High impact to get rid of it
                expected_profit_gain: 0, // No gain, just stopping the bleed
                recommendation_text: `Liquidate immediately. Margin has eroded by ${Math.abs(trueROI).toFixed(1)}% due to holding costs.`
            };
        }

        // PRICING optimization scenario
        if (inventoryMetrics.price_deviation_percent > 3) {
            const simulations = this.pricingEngine.simulatePriceDrops(
                profile, dealerCost, currentPrice, avgMarketPrice
            );

            // Find best simulation (highest net profit impact)
            const sortedSims = simulations.sort((a, b) => b.net_profit_impact - a.net_profit_impact);
            const bestSim = sortedSims[0];

            if (bestSim && bestSim.net_profit_impact > 0) {
                return {
                    car_id: profile.car_id,
                    action_type: 'reduce_price',
                    urgency: Math.min(100, 75 + (inventoryMetrics.days_on_market / 2)),
                    impact_score: bestSim.net_profit_impact,
                    expected_profit_gain: bestSim.net_profit_impact,
                    recommendation_text: `Reduce price by ₹${bestSim.price_drop.toLocaleString()}. The resulting ${bestSim.predicted_days_saved.toFixed(0)} days saved will offset the price drop and net +₹${bestSim.net_profit_impact.toFixed(0)} in profit capability.`
                };
            } else if (bestSim) {
                // Even if net profit impact isn't strictly positive, lowering might be necessary to sell
                return {
                    car_id: profile.car_id,
                    action_type: 'reduce_price',
                    urgency: Math.min(100, 60 + (inventoryMetrics.days_on_market / 2)),
                    impact_score: 50,
                    expected_profit_gain: bestSim.new_margin,
                    recommendation_text: `Overpriced by ${inventoryMetrics.price_deviation_percent.toFixed(1)}%. Reduce by ₹${bestSim.price_drop.toLocaleString()} to accelerate sale before holding costs erode remaining margin.`
                };
            }
        }

        return null;
    }
}
