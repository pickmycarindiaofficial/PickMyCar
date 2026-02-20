import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDealerCostProfile } from '@/hooks/useDealerCostProfile';
import { Percent, Megaphone, Loader2 } from 'lucide-react';

export function DealerCostSettings() {
    const { data: profile, isLoading, saveProfile, isPending } = useDealerCostProfile();

    const [costOfCapital, setCostOfCapital] = useState<string>('12.0');
    const [marketingCost, setMarketingCost] = useState<string>('0');

    // Load backend data into local state when it arrives
    useEffect(() => {
        if (profile) {
            setCostOfCapital(profile.cost_of_capital_percentage.toString());
            setMarketingCost(profile.average_marketing_cost_per_car.toString());
        }
    }, [profile]);

    const handleSave = () => {
        saveProfile.mutate({
            cost_of_capital_percentage: parseFloat(costOfCapital) || 12.0,
            average_marketing_cost_per_car: parseFloat(marketingCost) || 0,
        });
    };

    if (isLoading) {
        return (
            <Card className="animate-pulse">
                <CardHeader><div className="h-6 w-1/3 bg-muted rounded" /></CardHeader>
                <CardContent><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border">
            <CardHeader>
                <CardTitle className="text-lg">Profit Ledger Baselines</CardTitle>
                <CardDescription>
                    Set your operational costs so the Profit Engine can calculate your True ROI accurately.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Cost of Capital */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Annual Cost of Capital (APR)</label>
                        <div className="relative">
                            <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={costOfCapital}
                                onChange={(e) => setCostOfCapital(e.target.value)}
                                className="pl-9"
                                placeholder="12.0"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Used to calculate holding cost decay (e.g., Flooring line of credit interest rate).
                        </p>
                    </div>

                    {/* Marketing Cost */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Avg. Marketing Burn per Car</label>
                        <div className="relative">
                            <Megaphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                min="0"
                                value={marketingCost}
                                onChange={(e) => setMarketingCost(e.target.value)}
                                className="pl-9"
                                placeholder="2000"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            The average amount spent on ads or classifieds to sell a single unit.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={isPending} className="bg-primary text-primary-foreground">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Profit Baselines
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
