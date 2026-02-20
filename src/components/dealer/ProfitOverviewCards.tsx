import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, TrendingUp, AlertOctagon, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useProfitIntelligence } from '@/hooks/useProfitIntelligence';

export function ProfitOverviewCards() {
    const { actions, isLoading } = useProfitIntelligence();

    // For Phase 6, we infer some top-level metrics from the Decision Engine outputs
    // In a massive deployment, we'd hit the `dealer_profit_timeseries` directly for historical trend graphs.
    const totalExpectedGain = actions.reduce((sum, action) => sum + (action.expected_profit_gain || 0), 0);

    // Calculate mock capital locked (would come entirely from CapitalEngine ideally)
    const deadCapitalActions = actions.filter(a => a.action_type === 'liquidate');
    const highRiskCount = deadCapitalActions.length;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Projected Monthly Gain */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Projected Gain (Optimization)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {isLoading ? '...' : `+${formatCurrency(totalExpectedGain)}`}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Potential profit unlocked by actioning the AI queue
                    </p>
                </CardContent>
            </Card>

            {/* Capital Risk / Dead Capital */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Dead Capital Risk</CardTitle>
                    <AlertOctagon className={`h-4 w-4 ${highRiskCount > 0 ? 'text-destructive' : 'text-green-500'}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {isLoading ? '...' : `${highRiskCount} Vehicles`}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Holding costs are actively eroding remaining margin.
                    </p>
                </CardContent>
            </Card>

            {/* Suggested Actions Remaining */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pending Optimizations</CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {isLoading ? '...' : actions.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Actions in the Strategic Queue
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
