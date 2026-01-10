export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface DealerApplication {
  id: string;
  dealership_name: string;
  business_type?: string;
  year_established?: number;
  gst_number?: string;
  gst_certificate_url?: string;
  shop_registration_url?: string;
  pan_number?: string;
  pan_card_url?: string;
  owner_name: string;
  owner_aadhar_number?: string;
  owner_aadhar_url?: string;
  email: string;
  phone_number: string;
  alternate_phone?: string;
  is_phone_verified: boolean;
  phone_verified_at?: string;
  address: string;
  city_id?: string;
  state: string;
  pincode: string;
  dealer_agreement_url?: string;
  terms_accepted: boolean;
  terms_accepted_at?: string;
  requested_plan_id?: string;
  status: ApplicationStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  dealer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DealerProfile {
  id: string;
  dealership_name: string;
  business_type?: string;
  gst_number?: string;
  gst_certificate_url?: string;
  shop_registration_url?: string;
  pan_number?: string;
  pan_card_url?: string;
  owner_aadhar_url?: string;
  dealer_agreement_url?: string;
  address: string;
  city_id?: string;
  state: string;
  pincode: string;
  is_documents_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface DealerApplicationFormData {
  dealership_name: string;
  business_type?: string;
  year_established?: number;
  gst_number?: string;
  gst_certificate_url?: string;
  shop_registration_url?: string;
  pan_number?: string;
  pan_card_url?: string;
  owner_name: string;
  owner_aadhar_number?: string;
  owner_aadhar_url?: string;
  email: string;
  phone_number: string;
  alternate_phone?: string;
  address: string;
  city_id?: string;
  state: string;
  pincode: string;
  dealer_agreement_url?: string;
  terms_accepted: boolean;
  requested_plan_id?: string;
}
