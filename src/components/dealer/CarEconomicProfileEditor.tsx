import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEconomicProfile } from '@/hooks/useEconomicProfile';
import { IndianRupee, Wrench, Wallet, Loader2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CarListingWithRelations } from '@/types/car-listing';

interface CarEconomicProfileEditorProps {
    car: CarListingWithRelations;
    isOpen: boolean;
    onClose: () => void;
}

export function CarEconomicProfileEditor({ car, isOpen, onClose }: CarEconomicProfileEditorProps) {
    const { data: profile, isLoading, saveProfile, isPending } = useEconomicProfile(car.id);

    const [acquisitionCost, setAcquisitionCost] = useState<string>('');
    const [reconditioningCost, setReconditioningCost] = useState<string>('');
    const [dailyHoldingCost, setDailyHoldingCost] = useState<string>('250'); // Default ₹250/day

    // Load backend data into local state when it arrives
    useEffect(() => {
        if (profile) {
            setAcquisitionCost(profile.acquisition_cost.toString());
            setReconditioningCost(profile.reconditioning_cost.toString());
            setDailyHoldingCost(profile.daily_holding_cost.toString());
        }
    }, [profile, isOpen]);

    const expectedMargin = (car.expected_price || 0) - (parseFloat(acquisitionCost) || 0) - (parseFloat(reconditioningCost) || 0);

    const handleSave = async () => {
        await saveProfile.mutateAsync({
            acquisition_cost: parseFloat(acquisitionCost) || 0,
            reconditioning_cost: parseFloat(reconditioningCost) || 0,
            daily_holding_cost: parseFloat(dailyHoldingCost) || 0,
            expected_margin: expectedMargin,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" />
                        Profit Ledger Update
                    </DialogTitle>
                    <DialogDescription>
                        Enter your true unit economics for <b>{car.year_of_make} {car.brand?.name} {car.model?.name}</b> to activate Profit Intelligence.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">

                        <div className="space-y-2">
                            <Label htmlFor="acquisition">Acquisition Cost (Buying Price)</Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="acquisition"
                                    type="number"
                                    min="0"
                                    value={acquisitionCost}
                                    onChange={(e) => setAcquisitionCost(e.target.value)}
                                    className="pl-9 font-medium"
                                    placeholder="e.g., 450000"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="reconditioning">Reconditioning</Label>
                                <div className="relative">
                                    <Wrench className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="reconditioning"
                                        type="number"
                                        min="0"
                                        value={reconditioningCost}
                                        onChange={(e) => setReconditioningCost(e.target.value)}
                                        className="pl-9"
                                        placeholder="e.g., 15000"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="holding">Daily Lot Cost</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">₹</span>
                                    <Input
                                        id="holding"
                                        type="number"
                                        min="0"
                                        value={dailyHoldingCost}
                                        onChange={(e) => setDailyHoldingCost(e.target.value)}
                                        className="pl-8"
                                        placeholder="250"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Listing Price</p>
                                <p className="font-semibold">{formatCurrency(car.expected_price || 0)}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className="text-right">
                                <p className="text-sm font-medium text-muted-foreground">Gross Margin</p>
                                <p className={`font-bold ${expectedMargin > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {formatCurrency(expectedMargin)}
                                </p>
                            </div>
                        </div>

                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isPending || isLoading} className="bg-primary text-primary-foreground">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Ledger
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
