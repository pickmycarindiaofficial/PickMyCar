import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface CheckboxFilterGroupProps {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  showSearch?: boolean;
  showMoreThreshold?: number;
}

export const CheckboxFilterGroup = ({
  options,
  selected,
  onChange,
  showSearch = false,
  showMoreThreshold = 5,
}: CheckboxFilterGroupProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayOptions = showAll ? filteredOptions : filteredOptions.slice(0, showMoreThreshold);
  const hasMore = filteredOptions.length > showMoreThreshold;

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-3">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      )}
      <div className="space-y-2">
        {displayOptions.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={option}
              checked={selected.includes(option)}
              onCheckedChange={() => handleToggle(option)}
            />
            <label
              htmlFor={option}
              className="text-sm text-foreground cursor-pointer select-none"
            >
              {option}
            </label>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary hover:underline font-medium"
        >
          {showAll ? 'Show Less' : `Show More (${filteredOptions.length - showMoreThreshold})`}
        </button>
      )}
    </div>
  );
};
