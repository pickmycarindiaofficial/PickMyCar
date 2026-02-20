export interface CarEconomicProfile {
    id: string;
    car_id: string;
    dealer_id: string;
    acquisition_cost: number;
    reconditioning_cost: number;
    daily_holding_cost: number;
    expected_margin: number;
    created_at: string;
    updated_at: string;
}

export interface DealerCostProfile {
    id: string;
    dealer_id: string;
    average_marketing_cost_per_car: number;
    cost_of_capital_percentage: number;
    created_at: string;
    updated_at: string;
}

export interface DealerProfitTimeseries {
    id: string;
    dealer_id: string;
    snapshot_date: string;
    projected_monthly_profit: number;
    capital_locked: number;
    avg_turnover_days: number;
    created_at: string;
}
