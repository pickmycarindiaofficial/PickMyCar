import { memo, useCallback } from 'react';
import { Phone, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StickyActionBarProps {
    price: number;
    onCall: () => void;
    onWhatsApp: () => void;
    onBookTestDrive: () => void;
}

export const StickyActionBar = memo(({
    price,
    onCall,
    onWhatsApp,
    onBookTestDrive,
}: StickyActionBarProps) => {
    const formatPrice = useCallback((value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
        return `₹${(value / 100000).toFixed(2)} Lakh`;
    }, []);

    return (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border md:hidden safe-area-bottom">
            <div className="flex items-center justify-between gap-2 p-3">
                {/* Price Display */}
                <div className="flex-shrink-0">
                    <p className="text-lg font-bold text-foreground">{formatPrice(price)}</p>
                    <p className="text-xs text-muted-foreground">onwards</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onBookTestDrive}
                        className="h-10 px-3 touch-manipulation"
                    >
                        <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onWhatsApp}
                        className="h-10 px-3 touch-manipulation text-green-600 border-green-200 hover:bg-green-50"
                    >
                        <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        onClick={onCall}
                        className="h-10 px-4 touch-manipulation bg-gradient-to-r from-[#236ceb] to-[#4b8cf5]"
                    >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                    </Button>
                </div>
            </div>
        </div>
    );
});

StickyActionBar.displayName = 'StickyActionBar';
