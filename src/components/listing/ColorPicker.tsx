import { Check } from 'lucide-react';

const colorOptions = [
  { name: 'Black', value: 'black', hex: '#000000' },
  { name: 'White', value: 'white', hex: '#FFFFFF' },
  { name: 'Silver', value: 'silver', hex: '#C0C0C0' },
  { name: 'Grey', value: 'grey', hex: '#808080' },
  { name: 'Red', value: 'red', hex: '#DC2626' },
  { name: 'Blue', value: 'blue', hex: '#2563EB' },
  { name: 'Yellow', value: 'yellow', hex: '#EAB308' },
  { name: 'Green', value: 'green', hex: '#16A34A' },
  { name: 'Orange', value: 'orange', hex: '#EA580C' },
  { name: 'Brown', value: 'brown', hex: '#92400E' },
  { name: 'Gold', value: 'gold', hex: '#F59E0B' },
  { name: 'Maroon', value: 'maroon', hex: '#7F1D1D' },
];

interface ColorPickerProps {
  selected: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ selected, onChange }: ColorPickerProps) => {
  return (
    <div className="grid grid-cols-6 gap-4">
      {colorOptions.map((color) => {
        const isSelected = selected === color.value;
        const isWhite = color.value === 'white';

        return (
          <div key={color.value} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => onChange(color.value)}
              className={`relative h-10 w-10 rounded-full transition-all hover:scale-110 ${isWhite ? 'border-2 border-border' : ''
                } ${isSelected ? 'ring-4 ring-primary ring-offset-2' : ''}`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className={`h-5 w-5 ${isWhite ? 'text-foreground' : 'text-white'}`} />
                </div>
              )}
            </button>
            <span className="text-xs text-muted-foreground">{color.name}</span>
          </div>
        );
      })}
    </div>
  );
};
