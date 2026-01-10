import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface FieldOption {
  key: string;
  label: string;
  category: string;
}

const AVAILABLE_FIELDS: FieldOption[] = [
  // Basic Info
  { key: 'listing_id', label: 'Listing ID', category: 'Basic Info' },
  { key: 'brand', label: 'Brand', category: 'Basic Info' },
  { key: 'model', label: 'Model', category: 'Basic Info' },
  { key: 'variant', label: 'Variant', category: 'Basic Info' },
  { key: 'year', label: 'Year', category: 'Basic Info' },
  { key: 'color', label: 'Color', category: 'Basic Info' },
  { key: 'category', label: 'Category', category: 'Basic Info' },
  
  // Technical
  { key: 'km', label: 'KM Driven', category: 'Technical' },
  { key: 'fuel', label: 'Fuel Type', category: 'Technical' },
  { key: 'transmission', label: 'Transmission', category: 'Technical' },
  { key: 'body_type', label: 'Body Type', category: 'Technical' },
  { key: 'seats', label: 'Seats', category: 'Technical' },
  { key: 'owner', label: 'Ownership', category: 'Technical' },
  { key: 'condition', label: 'Condition', category: 'Technical' },
  
  // Pricing
  { key: 'price', label: 'Expected Price', category: 'Pricing' },
  { key: 'price_type', label: 'Price Type', category: 'Pricing' },
  
  // Status
  { key: 'status', label: 'Status', category: 'Status' },
  { key: 'payment_status', label: 'Payment Status', category: 'Status' },
  { key: 'is_featured', label: 'Featured', category: 'Status' },
  
  // Location
  { key: 'city', label: 'City', category: 'Location' },
  { key: 'state', label: 'State', category: 'Location' },
  { key: 'address', label: 'Full Address', category: 'Location' },
  
  // Contact
  { key: 'phone', label: 'Primary Phone', category: 'Contact' },
  { key: 'alternate_phone', label: 'Alternate Phone', category: 'Contact' },
  
  // Documentation
  { key: 'registration_number', label: 'Registration Number', category: 'Documentation' },
  { key: 'insurance_validity', label: 'Insurance Validity', category: 'Documentation' },
  
  // Dates
  { key: 'created_at', label: 'Listed Date', category: 'Dates' },
  { key: 'published_at', label: 'Published Date', category: 'Dates' },
];

interface FieldSelectorProps {
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

export default function FieldSelector({ selectedFields, onFieldsChange }: FieldSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categories = Array.from(new Set(AVAILABLE_FIELDS.map(f => f.category)));

  const toggleField = (key: string) => {
    if (selectedFields.includes(key)) {
      onFieldsChange(selectedFields.filter(f => f !== key));
    } else {
      onFieldsChange([...selectedFields, key]);
    }
  };

  const selectAll = () => {
    onFieldsChange(AVAILABLE_FIELDS.map(f => f.key));
  };

  const deselectAll = () => {
    onFieldsChange([]);
  };

  const resetToDefault = () => {
    onFieldsChange([
      'listing_id', 'brand', 'model', 'variant', 'year', 'registration_number', 'insurance_validity', 'km', 'fuel', 'transmission', 'price', 'status'
    ]);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              Customize Fields
              <Badge variant="secondary">
                {selectedFields.length}/{AVAILABLE_FIELDS.length}
              </Badge>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              Reset to Default
            </Button>
          </div>
        </div>

        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <div key={category} className="space-y-3">
                <h4 className="font-semibold text-sm">{category}</h4>
                <div className="space-y-2">
                  {AVAILABLE_FIELDS.filter(f => f.category === category).map(field => (
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
            ))}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
