import { Diamond, Car } from 'lucide-react';
import { CarSegment } from '@/types';
import { cn } from '@/lib/utils';

interface SegmentToggleProps {
    segment: CarSegment;
    onSegmentChange: (segment: CarSegment) => void;
    allCount: number;
    premiumCount: number;
}

export const SegmentToggle = ({
    segment,
    onSegmentChange,
    allCount,
    premiumCount,
}: SegmentToggleProps) => {
    return (
        <div className="flex w-full rounded-lg border border-border bg-muted/30 p-1">
            {/* All Button */}
            <button
                onClick={() => onSegmentChange('all')}
                className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200',
                    segment === 'all'
                        ? 'bg-white text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                )}
                aria-pressed={segment === 'all'}
            >
                <Car className="h-4 w-4" />
                <span>All</span>
                <span
                    className={cn(
                        'ml-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                        segment === 'all'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                    )}
                >
                    {allCount}
                </span>
            </button>

            {/* Premium Button */}
            <button
                onClick={() => onSegmentChange('premium')}
                className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200',
                    segment === 'premium'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                )}
                aria-pressed={segment === 'premium'}
            >
                <Diamond className="h-4 w-4" />
                <span>Premium</span>
                <span
                    className={cn(
                        'ml-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                        segment === 'premium'
                            ? 'bg-white/20 text-white'
                            : 'bg-muted text-muted-foreground'
                    )}
                >
                    {premiumCount}
                </span>
            </button>
        </div>
    );
};
