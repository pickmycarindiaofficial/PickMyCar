import { CarEconomicProfile } from '@/types/profit-intelligence';

export interface InventoryMetrics {
    days_on_market: number;
    lead_velocity: number; // Leads per day
    price_deviation_percent: number; // Compared to market (Positive = overpriced)
    segment_demand_score: number; // 0-100
}

export class InventoryEngine {
    // Configurable weights
    private readonly LEAD_VELOCITY_WEIGHT = 0.4;
    private readonly PRICE_ACCURACY_WEIGHT = 0.3;
    private readonly DEMAND_ALIGNMENT_WEIGHT = 0.2;
    private readonly AGING_PENALTY_WEIGHT = 0.1;

    public calculateHealthScore(metrics: InventoryMetrics, profile: CarEconomicProfile): number {
        // 1. Lead Velocity Ratio (Ideal threshold: > 1 lead per day)
        const velocityScore = Math.min((metrics.lead_velocity / 1.0) * 100, 100);

        // 2. Price Deviation Score
        // Positive deviation means overpriced. We penalize heavily.
        let priceScore = 100 - (Math.max(0, metrics.price_deviation_percent) * 5);
        priceScore = Math.max(priceScore, 0); // Cap at 0 minimum

        // 3. Segment Demand Score (Passed in from Market Signals)
        const demandScore = metrics.segment_demand_score;

        // 4. Aging Penalty (Starts eroding score after 30 days)
        const agingFactor = Math.max(0, metrics.days_on_market - 30);
        // Lose 2 points per day over 30 days
        const agingScore = Math.max(100 - (agingFactor * 2), 0);

        // Final Weighted Score
        const finalScore =
            (velocityScore * this.LEAD_VELOCITY_WEIGHT) +
            (priceScore * this.PRICE_ACCURACY_WEIGHT) +
            (demandScore * this.DEMAND_ALIGNMENT_WEIGHT) +
            (agingScore * this.AGING_PENALTY_WEIGHT);

        return Math.round(finalScore);
    }

    public getInventoryStatus(healthScore: number): 'Healthy' | 'Slow Moving' | 'Dead Capital' {
        if (healthScore >= 70) return 'Healthy';
        if (healthScore >= 40) return 'Slow Moving';
        return 'Dead Capital';
    }
}
