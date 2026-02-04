import { SortOption } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export const SortDropdown = ({ value, onChange }: SortDropdownProps) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger className="w-[180px] bg-background h-9">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent className="bg-popover">
        <SelectItem value="relevance">Relevance</SelectItem>
        <SelectItem value="price-low">Price: Low to High</SelectItem>
        <SelectItem value="price-high">Price: High to Low</SelectItem>
        <SelectItem value="year-new">Year: Newest First</SelectItem>
        <SelectItem value="year-old">Year: Oldest First</SelectItem>
        <SelectItem value="kms-low">Kms: Lowest First</SelectItem>
      </SelectContent>
    </Select>
  );
};
