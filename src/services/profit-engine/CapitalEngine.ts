import { CarEconomicProfile, DealerCostProfile } from '@/types/profit-intelligence';

export interface CapitalMetrics {
    total_inventory_value: number;
    cars_sold_last_30_days: number;
}

export class CapitalEngine {
    /**
     * Calculates the true ROI of a specific vehicle taking into account holding costs and capital cost.
     */
    public calculateTrueROI(
        profile: CarEconomicProfile,
        dealerCost: DealerCostProfile,
        daysOnMarket: number
    ): number {
        const grossMargin = profile.expected_margin;

        // Holding cost decay (lot space, insurance, maintenance)
        const accumulatedHoldingCost = daysOnMarket * profile.daily_holding_cost;

        // Marketing burn per car
        const marketingCost = dealerCost.average_marketing_cost_per_car;

        // Cost of Capital (Opportunity cost over the days held - e.g. flooring line of credit)
        const annualCapitalCost = (profile.acquisition_cost * (dealerCost.cost_of_capital_percentage / 100));
        const accumulatedCapitalCost = (annualCapitalCost / 365) * daysOnMarket;

        const netMargin = grossMargin - accumulatedHoldingCost - marketingCost - accumulatedCapitalCost;

        // ROI = Net Profit / Total Investment
        const totalInvestment = profile.acquisition_cost + profile.reconditioning_cost;

        if (totalInvestment <= 0) return 0; // Prevent division by zero

        return (netMargin / totalInvestment) * 100;
    }

    /**
     * Calculates the overall capital efficiency of the dealership portfolio.
     */
    public calculatePortfolioHealth(
        profiles: CarEconomicProfile[],
        metrics: CapitalMetrics,
        dealerCost: DealerCostProfile,
        getDaysOnMarket: (carId: string) => number
    ) {
        let totalDeadCapital = 0;

        for (const profile of profiles) {
            const days = getDaysOnMarket(profile.car_id);
            const roi = this.calculateTrueROI(profile, dealerCost, days);
            // If the true ROI is negative, the capital is considered "dead" or bleeding
            if (roi < 0) {
                totalDeadCapital += profile.acquisition_cost;
            }
        }

        // Higher capital lock score means a higher percentage of the inventory is losing money
        const capitalLockScore = (metrics.total_inventory_value > 0)
            ? (totalDeadCapital / metrics.total_inventory_value) * 100
            : 0;

        return {
            totalDeadCapital,
            capitalLockScore: Math.min(capitalLockScore, 100),
            portfolioRisk: capitalLockScore > 30 ? 'High' : capitalLockScore > 15 ? 'Medium' : 'Low'
        };
    }
}
