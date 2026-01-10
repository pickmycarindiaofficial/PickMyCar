import { Car } from '@/types';
import { CarCard } from '@/components/content/CarCard';

interface SimilarCarsProps {
  currentCar: Car;
  allCars: Car[];
  onCarClick: (car: Car) => void;
  onCallDealer: (car: Car) => void;
  onChat: (car: Car) => void;
  onToggleShortlist: (carId: string) => void;
  shortlistedIds: string[];
}

export const SimilarCars = ({
  currentCar,
  allCars,
  onCarClick,
  onCallDealer,
  onChat,
  onToggleShortlist,
  shortlistedIds,
}: SimilarCarsProps) => {
  const similarCars = allCars
    .filter((car) => car.bodyType === currentCar.bodyType && car.id !== currentCar.id)
    .slice(0, 4);

  if (similarCars.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Similar Cars You Might Like</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {similarCars.map((car) => (
          <CarCard
            key={car.id}
            car={car}
            onCallDealer={() => onCallDealer(car)}
            onChat={() => onChat(car)}
            onToggleShortlist={() => onToggleShortlist(car.id)}
            isShortlisted={shortlistedIds.includes(car.id)}
            onCardClick={() => onCarClick(car)}
          />
        ))}
      </div>
    </div>
  );
};
