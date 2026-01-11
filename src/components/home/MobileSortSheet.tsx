import { memo } from 'react';
import { Check, X } from 'lucide-react';
import { SortOption } from '@/types';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

interface MobileSortSheetProps {
    isOpen: boolean;
    onClose: () => void;
    value: SortOption;
    onChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string; description: string }[] = [
    { value: 'relevance', label: 'Relevance', description: 'Most relevant first' },
    { value: 'price-low', label: 'Price: Low to High', description: 'Cheapest first' },
    { value: 'price-high', label: 'Price: High to Low', description: 'Most expensive first' },
    { value: 'year-new', label: 'Year: Newest First', description: 'Latest models first' },
    { value: 'year-old', label: 'Year: Oldest First', description: 'Older models first' },
    { value: 'kms-low', label: 'Kms: Low to High', description: 'Least driven first' },
];

export const MobileSortSheet = memo(({
    isOpen,
    onClose,
    value,
    onChange,
}: MobileSortSheetProps) => {
    const handleSelect = (sortValue: SortOption) => {
        onChange(sortValue);
        onClose();
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-xl">
                <SheetHeader className="pb-2">
                    <SheetTitle>Sort By</SheetTitle>
                </SheetHeader>
                <div className="space-y-1 pb-4">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors touch-manipulation ${value === option.value
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-muted'
                                }`}
                        >
                            <div className="text-left">
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                            {value === option.value && (
                                <Check className="h-5 w-5 text-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
});

MobileSortSheet.displayName = 'MobileSortSheet';
