import { useState } from 'react';
import { Check } from 'lucide-react';
import { Car } from '@/types';
import { cn } from '@/lib/utils';

interface DetailsTabsProps {
  car: Car;
}

type TabType = 'overview' | 'specifications' | 'features';

export const DetailsTabs = ({ car }: DetailsTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'features', label: 'Features' },
  ];

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Tab Buttons */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium">{car.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">KMs Driven</p>
                <p className="font-medium">{car.kmsDriven.toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fuel Type</p>
                <p className="font-medium">{car.fuelType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transmission</p>
                <p className="font-medium">{car.transmission}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-medium">{car.owner}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Body Type</p>
                <p className="font-medium">{car.bodyType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <p className="font-medium">{car.color}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seats</p>
                <p className="font-medium">{car.seats}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{car.category}</p>
              </div>
              {car.registrationNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Registration</p>
                  <p className="font-medium">{car.registrationNumber}</p>
                </div>
              )}
              {car.insuranceValidity && (
                <div>
                  <p className="text-sm text-muted-foreground">Insurance</p>
                  <p className="font-medium">{car.insuranceValidity}</p>
                </div>
              )}
              {car.rtoLocation && (
                <div>
                  <p className="text-sm text-muted-foreground">RTO</p>
                  <p className="font-medium">{car.rtoLocation}</p>
                </div>
              )}
            </div>
            {car.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{car.description}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'specifications' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {car.engineSize && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Engine</span>
                <span className="font-medium">{car.engineSize}</span>
              </div>
            )}
            {car.mileage && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Mileage</span>
                <span className="font-medium">{car.mileage}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Transmission</span>
              <span className="font-medium">{car.transmission}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Fuel Type</span>
              <span className="font-medium">{car.fuelType}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Seating Capacity</span>
              <span className="font-medium">{car.seats} Seater</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Body Type</span>
              <span className="font-medium">{car.bodyType}</span>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-6">
            {car.categorizedFeatures && Object.keys(car.categorizedFeatures).length > 0 ? (
              Object.entries(car.categorizedFeatures).map(([category, featureList]) => (
                <div key={category}>
                  <h3 className="font-semibold text-sm sm:text-base uppercase mb-3 text-foreground">{category}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {featureList.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : car.features && car.features.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {car.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm sm:text-base">No features information available for this vehicle.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
