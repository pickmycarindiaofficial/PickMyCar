import { Input } from '@/components/ui/input';

interface PriceRangeFilterProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

export const PriceRangeFilter = ({ min, max, onChange }: PriceRangeFilterProps) => {
  const formatPrice = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} Lakh`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatPrice(min)}</span>
        <span>{formatPrice(max)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Input
            type="number"
            placeholder="Min"
            value={min || ''}
            onChange={(e) => onChange(Number(e.target.value) || 0, max)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Input
            type="number"
            placeholder="Max"
            value={max || ''}
            onChange={(e) => onChange(min, Number(e.target.value) || 20000000)}
            className="h-9 text-sm"
          />
        </div>
      </div>
    </div>
  );
};
