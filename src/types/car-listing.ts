export type ListingStatus = 
  | 'pending_verification'
  | 'verified'
  | 'live'
  | 'rejected'
  | 'sold'
  | 'expired';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export type PriceType = 'fixed' | 'negotiable';

export type CarCondition = 'excellent' | 'good' | 'fair' | 'needs_work';

export type SellerType = 'individual' | 'dealer';

export interface ImageUpload {
  url: string;
  thumbnail_url?: string;
  medium_url?: string;
  size: number;
  width?: number;
  height?: number;
}

export interface CarListing {
  id: string;
  listing_id?: string;
  
  // Seller
  seller_type: SellerType;
  seller_id: string;
  seller_name?: string;
  
  // Status
  status: ListingStatus;
  payment_status: PaymentStatus;
  call_verified: boolean;
  call_verified_at?: string;
  call_verified_by?: string;
  
  // Car details
  brand_id: string;
  model_id: string;
  variant: string;
  year_of_make: number;
  year_of_purchase?: number;
  
  // Specs
  kms_driven: number;
  fuel_type_id: string;
  transmission_id: string;
  body_type_id: string;
  color: string;
  seats?: number;
  
  // Ownership
  owner_type_id: string;
  car_condition: CarCondition;
  
  // Pricing
  expected_price: number;
  price_type: PriceType;
  
  // Media
  photos: ImageUpload[];
  
  // Documents
  rc_book_url?: string;
  insurance_url?: string;
  loan_papers_url?: string;
  has_loan: boolean;
  
  // Contact
  primary_phone?: string;
  alternate_phone?: string;
  city_id: string;
  full_address?: string;
  
  // Additional
  description?: string;
  highlights?: string[];
  
  // Featured
  is_featured: boolean;
  featured_until?: string;
  
  category_id?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  sold_at?: string;
  
  // Documentation
  registration_number?: string;
  insurance_status?: 'valid' | 'expired' | 'not_applicable';
  insurance_validity?: string;
  
  // Metadata
  rejection_reason?: string;
  admin_notes?: string;
  view_count: number;
  enquiry_count: number;
}

export interface CarListingInput {
  seller_type: SellerType;
  seller_name?: string;
  brand_id: string;
  model_id: string;
  variant: string;
  year_of_make: number;
  year_of_purchase?: number;
  kms_driven: number;
  fuel_type_id: string;
  transmission_id: string;
  body_type_id: string;
  color: string;
  seats?: number;
  owner_type_id: string;
  car_condition: CarCondition;
  expected_price: number;
  price_type: PriceType;
  photos: ImageUpload[];
  rc_book_url?: string;
  insurance_url?: string;
  loan_papers_url?: string;
  has_loan: boolean;
  primary_phone?: string;
  alternate_phone?: string;
  city_id: string;
  full_address?: string;
  description?: string;
  highlights?: string[];
  category_id?: string;
  feature_ids?: string[];
  registration_number?: string;
  insurance_status?: 'valid' | 'expired' | 'not_applicable';
  insurance_validity?: string;
}

export interface CarListingWithRelations extends CarListing {
  brand?: { id: string; name: string; logo_url?: string };
  model?: { id: string; name: string };
  fuel_type?: { id: string; name: string };
  transmission?: { id: string; name: string };
  body_type?: { id: string; name: string };
  owner_type?: { id: string; name: string };
  city?: { id: string; name: string; state?: string };
  category?: { id: string; name: string; badge_color?: string };
  seller?: { id: string; username: string; full_name: string; phone_number?: string };
  features?: Array<{
    id: string;
    name: string;
    category: string | null;
    icon: string | null;
  }>;
}
