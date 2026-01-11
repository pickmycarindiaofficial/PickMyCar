export interface Car {
  id: string;
  title: string;
  year: number;
  brand: string;
  model: string;
  variant: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  kmsDriven: number;
  fuelType: 'Petrol' | 'Diesel' | 'CNG' | 'Electric';
  transmission: 'Manual' | 'Automatic';
  owner: '1st Owner' | '2nd Owner' | '3rd Owner' | '4+ Owners';
  location: string;
  city: string;
  bodyType: string;
  category: 'Certified' | 'Brand Warranty' | 'New Car Warranty' | 'Non Warranty';
  features: string[];
  featuresMetadata?: Array<{
    id: string;
    name: string;
    icon: string | null;
    category: string | null;
  }>;
  seats: number;
  color: string;
  availability: 'In Stock' | 'Booked' | 'Sold';
  isFeatured?: boolean;
  dealerId: string;
  sellerId?: string;
  multipleImageUrls?: string[];
  description?: string;
  reasonsToBuy?: string[];
  categorizedFeatures?: Record<string, string[]>;
  engineSize?: string;
  mileage?: string;
  registrationNumber?: string;
  insuranceValidity?: string;
  rtoLocation?: string;
  emiPerMonth?: number;
  priceDrop?: {
    amount: number;
    expiryDate?: string;
    label?: string;
  };
}

export interface Dealer {
  id: string;
  name: string;
  phone: string;
  city: string;
  rating: number;
  carsCount: number;
  logo_url?: string | null;
  year_established?: number | null;
}

export type CarSegment = 'all' | 'premium';

export interface Filters {
  segment: CarSegment;
  city: string;
  brands: string[];
  models: string[];
  categories: string[];
  years: string[];
  fuelTypes: string[];
  bodyTypes: string[];
  transmissions: string[];
  features: string[];
  seats: string[];
  owners: string[];
  kmsDriven: string;
  colors: string[];
  availability: string[];
  searchTerm: string;
  priceMin?: number;
  priceMax?: number;
}

export type SortOption = 'relevance' | 'price-low' | 'price-high' | 'year-new' | 'year-old' | 'kms-low';

export interface CityStats {
  totalCars: number;
  startingPrice: number;
  topBrands: string[];
  popularModels: Array<{
    name: string;
    priceRange: string;
    count: number;
  }>;
}
