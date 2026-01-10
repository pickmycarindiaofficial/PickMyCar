import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Filter, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePrintStockList, PrintStockFilters } from "@/hooks/usePrintStockList";
import { useBrands } from "@/hooks/useBrands";
import { useModels } from "@/hooks/useModels";
import { useFuelTypes } from "@/hooks/useFuelTypes";
import { useTransmissions } from "@/hooks/useTransmissions";
import { useBodyTypes } from "@/hooks/useBodyTypes";
import { useDealers } from "@/hooks/useDealers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import FieldSelector from "./FieldSelector";
import ExportButtons from "./ExportButtons";
import { DataTable } from "@/components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";

export default function StockListTab() {
  const { roles } = useAuth();
  const isPowerDesk = roles?.includes('powerdesk');
  
  const [filters, setFilters] = useState<PrintStockFilters>({});
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'listing_id', 'brand', 'model', 'variant', 'year', 'km', 'fuel', 'transmission', 'price', 'status'
  ]);
  const [selectedCars, setSelectedCars] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  const { data: cars = [], isLoading } = usePrintStockList(filters);
  const { data: brands = [] } = useBrands();
  const { data: models = [] } = useModels();
  const { data: fuelTypes = [] } = useFuelTypes();
  const { data: transmissions = [] } = useTransmissions();
  const { data: bodyTypes = [] } = useBodyTypes();
  const { data: dealers = [] } = useDealers();

  const handleFilterChange = (key: keyof PrintStockFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const toggleSelectAll = () => {
    if (selectedCars.length === cars.length) {
      setSelectedCars([]);
    } else {
      setSelectedCars(cars.map((car: any) => car.id));
    }
  };

  const toggleCarSelection = (carId: string) => {
    setSelectedCars(prev =>
      prev.includes(carId)
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    );
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={selectedCars.length === cars.length && cars.length > 0}
          onCheckedChange={toggleSelectAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedCars.includes(row.original.id)}
          onCheckedChange={() => toggleCarSelection(row.original.id)}
        />
      ),
    },
    {
      accessorKey: "listing_id",
      header: "Listing ID",
    },
    {
      accessorKey: "brands.name",
      header: "Brand",
    },
    {
      accessorKey: "models.name",
      header: "Model",
    },
    {
      accessorKey: "variant",
      header: "Variant",
    },
    {
      accessorKey: "year_of_make",
      header: "Year",
    },
    {
      accessorKey: "kms_driven",
      header: "KM",
      cell: ({ row }) => row.original.kms_driven?.toLocaleString(),
    },
    {
      accessorKey: "expected_price",
      header: "Price",
      cell: ({ row }) => `₹${Number(row.original.expected_price).toLocaleString()}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'live' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  const selectedCarsData = cars.filter((car: any) => selectedCars.includes(car.id));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {!showFilters && Object.keys(filters).length > 0 && (
                  <Badge variant="secondary">{Object.keys(filters).length} active</Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isPowerDesk && (
                <div className="space-y-2">
                  <Label>Dealer</Label>
                  <Select
                    value={filters.dealerId}
                    onValueChange={(value) => handleFilterChange('dealerId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Dealers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dealers</SelectItem>
                      {dealers.map((dealer: any) => (
                        <SelectItem key={dealer.id} value={dealer.id}>
                          {dealer.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex flex-wrap gap-2">
                  {['live', 'verified', 'pending_verification', 'draft'].map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={status}
                        checked={filters.statuses?.includes(status)}
                        onCheckedChange={(checked) => {
                          const newStatuses = checked
                            ? [...(filters.statuses || []), status]
                            : (filters.statuses || []).filter(s => s !== status);
                          handleFilterChange('statuses', newStatuses);
                        }}
                      />
                      <Label htmlFor={status} className="text-sm capitalize">
                        {status.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Field Selector */}
      <FieldSelector
        selectedFields={selectedFields}
        onFieldsChange={setSelectedFields}
      />

      {/* Cars Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Stock Listings</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCars.length} of {cars.length} selected
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={cars} />
        )}
      </Card>

      {/* Export Buttons */}
      <ExportButtons
        selectedCars={selectedCarsData}
        selectedFields={selectedFields}
        disabled={selectedCars.length === 0}
      />
    </div>
  );
}
