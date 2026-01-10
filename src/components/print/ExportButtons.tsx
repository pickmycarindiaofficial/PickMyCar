import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileSpreadsheet, FileText, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, exportToPDF, exportToWord, ExportField } from "@/lib/exportHelpers";

interface ExportButtonsProps {
  selectedCars: any[];
  selectedFields: string[];
  disabled?: boolean;
}

const FIELD_MAPPINGS: Record<string, ExportField> = {
  listing_id: { key: 'listing_id', label: 'Listing ID' },
  brand: { key: 'brands.name', label: 'Brand' },
  model: { key: 'models.name', label: 'Model' },
  variant: { key: 'variant', label: 'Variant' },
  year: { key: 'year_of_make', label: 'Year' },
  color: { key: 'color', label: 'Color' },
  category: { key: 'car_categories.name', label: 'Category' },
  km: { 
    key: 'kms_driven', 
    label: 'KM Driven',
    format: (val) => val?.toLocaleString() || '0'
  },
  fuel: { key: 'fuel_types.name', label: 'Fuel Type' },
  transmission: { key: 'transmissions.name', label: 'Transmission' },
  body_type: { key: 'body_types.name', label: 'Body Type' },
  seats: { key: 'seats', label: 'Seats' },
  owner: { key: 'owner_types.name', label: 'Ownership' },
  condition: { key: 'car_condition', label: 'Condition' },
  price: { 
    key: 'expected_price', 
    label: 'Price',
    format: (val) => `₹${Number(val).toLocaleString()}`
  },
  price_type: { key: 'price_type', label: 'Price Type' },
  status: { key: 'status', label: 'Status' },
  payment_status: { key: 'payment_status', label: 'Payment Status' },
  is_featured: { 
    key: 'is_featured', 
    label: 'Featured',
    format: (val) => val ? 'Yes' : 'No'
  },
  city: { key: 'cities.name', label: 'City' },
  state: { key: 'cities.state', label: 'State' },
  address: { key: 'full_address', label: 'Address' },
  phone: { key: 'primary_phone', label: 'Phone' },
  alternate_phone: { key: 'alternate_phone', label: 'Alternate Phone' },
  created_at: { 
    key: 'created_at', 
    label: 'Listed Date',
    format: (val) => new Date(val).toLocaleDateString()
  },
  published_at: { 
    key: 'published_at', 
    label: 'Published Date',
    format: (val) => val ? new Date(val).toLocaleDateString() : 'Not Published'
  },
};

export default function ExportButtons({ selectedCars, selectedFields, disabled }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const getExportFields = (): ExportField[] => {
    return selectedFields
      .map(key => FIELD_MAPPINGS[key])
      .filter(Boolean);
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'word') => {
    if (selectedCars.length === 0) {
      toast.error('Please select at least one car to export');
      return;
    }

    setExporting(format);
    try {
      const fields = getExportFields();
      const dealerName = selectedCars[0]?.profiles?.full_name;

      switch (format) {
        case 'excel':
          await exportToExcel(selectedCars, fields);
          toast.success(`Exported ${selectedCars.length} cars to Excel`);
          break;
        case 'pdf':
          await exportToPDF(selectedCars, fields, 'stock-list', dealerName);
          toast.success(`Exported ${selectedCars.length} cars to PDF`);
          break;
        case 'word':
          await exportToWord(selectedCars, fields, 'stock-list', dealerName);
          toast.success(`Exported ${selectedCars.length} cars to Word`);
          break;
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      toast.error(`Failed to export to ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Export Stock List</h3>
          <p className="text-sm text-muted-foreground">
            Export {selectedCars.length} selected car(s) with {selectedFields.length} field(s)
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => handleExport('excel')}
            disabled={disabled || exporting !== null}
            className="gap-2"
          >
            {exporting === 'excel' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Export Excel
          </Button>

          <Button
            onClick={() => handleExport('pdf')}
            disabled={disabled || exporting !== null}
            variant="outline"
            className="gap-2"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Export PDF
          </Button>

          <Button
            onClick={() => handleExport('word')}
            disabled={disabled || exporting !== null}
            variant="outline"
            className="gap-2"
          >
            {exporting === 'word' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <File className="h-4 w-4" />
            )}
            Export Word
          </Button>
        </div>
      </div>
    </Card>
  );
}
