import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useBrands } from '@/hooks/useBrands';
import { useCities } from '@/hooks/useCities';

interface LeadManagementFiltersProps {
  onFilterChange: (filters: any) => void;
}

export function LeadManagementFilters({ onFilterChange }: LeadManagementFiltersProps) {
  const [dateRange, setDateRange] = useState<[Date, Date] | undefined>();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState<string>('all');
  const [brand, setBrand] = useState<string>('all');
  const [channel, setChannel] = useState<string>('all');

  const { data: brands } = useBrands();
  const { data: cities } = useCities();

  const handleApplyFilters = () => {
    onFilterChange({
      dateRange,
      search: search || undefined,
      city: city !== 'all' ? city : undefined,
      brand: brand !== 'all' ? brand : undefined,
      channel: channel !== 'all' ? channel : undefined
    });
  };

  const handleReset = () => {
    setDateRange(undefined);
    setSearch('');
    setCity('all');
    setBrand('all');
    setChannel('all');
    onFilterChange({});
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 bg-card rounded-lg border">
      <div className="flex-1 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or car..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-[200px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange ? (
                `${format(dateRange[0], 'MMM dd')} - ${format(dateRange[1], 'MMM dd')}`
              ) : (
                <span>Last 7 days</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 7);
                  setDateRange([start, end]);
                }}
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 30);
                  setDateRange([start, end]);
                }}
              >
                Last 30 days
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* City */}
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities?.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Brand */}
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands?.map((b) => (
              <SelectItem key={b.id} value={b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Channel */}
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleApplyFilters} size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Apply
        </Button>
        <Button onClick={handleReset} variant="outline" size="sm">
          Reset
        </Button>
      </div>
    </div>
  );
}
