import { ChevronRight } from 'lucide-react';
import { Car } from '@/types';

interface BreadcrumbsProps {
  car: Car;
  onBack: () => void;
}

export const Breadcrumbs = ({ car, onBack }: BreadcrumbsProps) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <button
        onClick={onBack}
        className="hover:text-foreground transition-colors"
      >
        Home
      </button>
      <ChevronRight className="h-4 w-4" />
      <button
        onClick={onBack}
        className="hover:text-foreground transition-colors"
      >
        {car.brand} Cars
      </button>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground font-medium truncate">
        {car.brand} {car.model}
      </span>
    </nav>
  );
};
