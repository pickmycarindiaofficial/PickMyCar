import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Printer, Download } from "lucide-react";
import { usePrintStockList } from "@/hooks/usePrintStockList";
import { useCarWithFeatures } from "@/hooks/useCarWithFeatures";
import { useDealerProfile } from "@/hooks/useDealerProfile";
import { usePrintSpecSheet } from "@/hooks/usePrintSpecSheet";
import SpecSheetPreview from "./SpecSheetPreview";

const SPEC_FIELDS = [
  { key: 'registration', label: 'Registration Number' },
  { key: 'brand_model', label: 'Brand & Model' },
  { key: 'variant', label: 'Variant' },
  { key: 'year', label: 'Year of Make' },
  { key: 'km', label: 'KM Driven' },
  { key: 'fuel', label: 'Fuel Type' },
  { key: 'transmission', label: 'Transmission' },
  { key: 'ownership', label: 'Ownership' },
  { key: 'insurance', label: 'Insurance Valid Until' },
  { key: 'color', label: 'Color' },
  { key: 'seats', label: 'Seats' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'features', label: 'Features List' },
];

export default function SpecSheetTab() {
  const { user } = useAuth();
  const [selectedCarId, setSelectedCarId] = useState<string>('');
  const [template, setTemplate] = useState<'standard' | 'compact' | 'premium'>('standard');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'brand_model', 'variant', 'year', 'km', 'fuel', 'transmission', 'ownership', 'price', 'features'
  ]);
  const [showPreview, setShowPreview] = useState(false);
  const [customPhone, setCustomPhone] = useState('');

  const { data: cars = [] } = usePrintStockList();
  const { data: carData } = useCarWithFeatures(selectedCarId);
  const { data: dealerProfile } = useDealerProfile(user?.id);
  const { componentRef, handlePrint, handleSaveAsPDF } = usePrintSpecSheet();

  const toggleField = (key: string) => {
    if (selectedFields.includes(key)) {
      setSelectedFields(selectedFields.filter(f => f !== key));
    } else {
      setSelectedFields([...selectedFields, key]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <div className="space-y-6">
        {/* Step 1: Select Car */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Step 1: Select Car</h3>
            <p className="text-sm text-muted-foreground">Choose the car for spec sheet</p>
          </div>

          <div className="space-y-2">
            <Label>Car Listing</Label>
            <Select value={selectedCarId} onValueChange={setSelectedCarId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a car" />
              </SelectTrigger>
              <SelectContent>
                {cars.map((car: any) => (
                  <SelectItem key={car.id} value={car.id}>
                    {car.listing_id} - {car.brands?.name} {car.models?.name} ({car.year_of_make})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Step 2: Choose Template */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Step 2: Choose Template</h3>
            <p className="text-sm text-muted-foreground">Select a design layout</p>
          </div>

          <RadioGroup value={template} onValueChange={(v: any) => setTemplate(v)}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <RadioGroupItem value="standard" id="standard" />
              <Label htmlFor="standard" className="flex-1 cursor-pointer">
                <div className="font-medium">Standard</div>
                <div className="text-sm text-muted-foreground">Classic layout matching sample</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <RadioGroupItem value="compact" id="compact" />
              <Label htmlFor="compact" className="flex-1 cursor-pointer">
                <div className="font-medium">Compact</div>
                <div className="text-sm text-muted-foreground">Smaller size, 2 per page</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <RadioGroupItem value="premium" id="premium" />
              <Label htmlFor="premium" className="flex-1 cursor-pointer">
                <div className="font-medium">Premium</div>
                <div className="text-sm text-muted-foreground">With car photo and QR code</div>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Step 3: Customize Fields & Content */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Step 3: Customize Content</h3>
            <p className="text-sm text-muted-foreground">Select details to display</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customPhone">Contact Number on Sheet</Label>
              <input
                id="customPhone"
                type="text"
                value={customPhone}
                onChange={(e: any) => setCustomPhone(e.target.value)}
                placeholder="e.g. +91 99999 88888"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {SPEC_FIELDS.map(field => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={selectedFields.includes(field.key)}
                    onCheckedChange={() => toggleField(field.key)}
                  />
                  <Label htmlFor={field.key} className="text-sm cursor-pointer">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Step 4: Actions */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Step 4: Actions</h3>
            <p className="text-sm text-muted-foreground">Preview or print spec sheet</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setShowPreview(true)}
              disabled={!selectedCarId}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Spec Sheet
            </Button>

            <Button
              onClick={handlePrint}
              disabled={!selectedCarId || !showPreview}
              variant="outline"
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button
              onClick={handleSaveAsPDF}
              disabled={!selectedCarId || !showPreview}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Save as PDF
            </Button>
          </div>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">
        <SpecSheetPreview
          ref={componentRef}
          carData={carData}
          dealerProfile={dealerProfile}
          template={template}
          selectedFields={selectedFields}
          showPreview={showPreview}
          customPhone={customPhone}
        />
      </div>
    </div>
  );
}
