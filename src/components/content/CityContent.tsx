import { Car } from '@/types';

interface CityContentProps {
  city: string;
  totalCars: number;
  cars: Car[];
}

export const CityContent = ({ city, totalCars, cars }: CityContentProps) => {
  const startingPrice = Math.min(...cars.map((car) => car.price));
  const topBrands = [...new Set(cars.map((car) => car.brand))].slice(0, 5);

  const modelCounts: Record<string, { count: number; minPrice: number; maxPrice: number }> = {};
  cars.forEach((car) => {
    const key = `${car.brand} ${car.model}`;
    if (!modelCounts[key]) {
      modelCounts[key] = { count: 0, minPrice: car.price, maxPrice: car.price };
    }
    modelCounts[key].count++;
    modelCounts[key].minPrice = Math.min(modelCounts[key].minPrice, car.price);
    modelCounts[key].maxPrice = Math.max(modelCounts[key].maxPrice, car.price);
  });

  const topModels = Object.entries(modelCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      priceRange: `₹${(data.minPrice / 100000).toFixed(2)}L - ₹${(data.maxPrice / 100000).toFixed(2)}L`,
      count: data.count,
    }));

  return (
    <div className="mb-8 space-y-6">
      {/* City Hero */}
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
        <h1 className="mb-2 text-3xl font-bold">Used Cars in {city}</h1>
        <p className="text-lg opacity-90">{totalCars} Cars Available</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Cars</p>
          <p className="text-2xl font-bold text-foreground">{totalCars}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Starting Price</p>
          <p className="text-2xl font-bold text-foreground">
            ₹{(startingPrice / 100000).toFixed(2)} Lakh
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Top Brands</p>
          <p className="text-sm font-medium text-foreground">{topBrands.join(', ')}</p>
        </div>
      </div>

      {/* Top Cars Table */}
      {topModels.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-bold text-foreground">
            Most Popular Cars in {city}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Model</th>
                  <th className="pb-3 font-medium">Price Range</th>
                  <th className="pb-3 font-medium">Popularity</th>
                </tr>
              </thead>
              <tbody>
                {topModels.map((model, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium text-foreground">{model.name}</td>
                    <td className="py-3 text-muted-foreground">{model.priceRange}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(model.count / topModels[0].count) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{model.count}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
