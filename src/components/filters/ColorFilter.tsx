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
];

interface ColorFilterProps {
  selected: string[];
  onChange: (colors: string[]) => void;
}

export const ColorFilter = ({ selected, onChange }: ColorFilterProps) => {
  const handleToggle = (colorValue: string) => {
    if (selected.includes(colorValue)) {
      onChange(selected.filter((c) => c !== colorValue));
    } else {
      onChange([...selected, colorValue]);
    }
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {colorOptions.map((color) => {
        const isSelected = selected.includes(color.value);
        const isWhite = color.value === 'white';
        
        return (
          <button
            key={color.value}
            onClick={() => handleToggle(color.value)}
            className={`relative h-10 w-10 rounded-full transition-all hover:scale-110 ${
              isWhite ? 'border-2 border-border' : ''
            }`}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          >
            {isSelected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className={`h-5 w-5 ${isWhite ? 'text-foreground' : 'text-white'}`} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
