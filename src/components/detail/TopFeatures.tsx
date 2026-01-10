import { Card } from '@/components/ui/card';
import { Shield, Zap, Gauge, Wind, Navigation, Radio } from 'lucide-react';

interface TopFeaturesProps {
  features: string[];
}

const featureIcons: Record<string, any> = {
  // Safety features
  'ABS': Shield,
  'Airbags': Shield,
  'Electronic Stability Control': Shield,
  'Traction Control': Shield,
  'Hill Assist': Shield,
  'Parking Sensors': Shield,
  'Reverse Camera': Shield,
  'ISOFIX': Shield,
  
  // Technology
  'Touchscreen': Zap,
  'Android Auto': Zap,
  'Apple CarPlay': Zap,
  'Navigation System': Navigation,
  'Bluetooth': Zap,
  'USB': Zap,
  'Wireless Charging': Zap,
  
  // Comfort
  'Climate Control': Wind,
  'Automatic Climate Control': Wind,
  'Air Conditioning': Wind,
  'Rear AC Vents': Wind,
  'Cruise Control': Gauge,
  'Leather Seats': Wind,
  'Sunroof': Wind,
  'Power Windows': Wind,
  'Keyless Entry': Zap,
  'Push Button Start': Zap,
  
  // Audio
  'Speakers': Radio,
  'Subwoofer': Radio,
  'Premium Sound System': Radio,
};

export function TopFeatures({ features }: TopFeaturesProps) {
  if (!features || features.length === 0) return null;

  // Filter to show only features with icons (top rated)
  const topFeatures = features
    .filter(feature => featureIcons[feature])
    .slice(0, 6);

  if (topFeatures.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Top Rated Features</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {topFeatures.map((feature, index) => {
          const Icon = featureIcons[feature] || Zap;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium">{feature}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
