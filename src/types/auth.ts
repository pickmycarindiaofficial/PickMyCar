export type AppRole =
  | 'powerdesk'
  | 'website_manager'
  | 'dealer'
  | 'sales'
  | 'finance'
  | 'inspection'
  | 'user'
  | 'dealer_staff';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_by?: string;
  assigned_at: string;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  powerdesk: 'PowerDesk Admin',
  website_manager: 'Website Manager',
  dealer: 'Dealer',
  sales: 'Sales Team',
  finance: 'Finance Team',
  inspection: 'Inspection Team',
  user: 'Customer/User',
  dealer_staff: 'Dealer Staff'
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  powerdesk: 'Full system access and control',
  website_manager: 'Manage website content and SEO',
  dealer: 'Manage car inventory and leads',
  sales: 'Handle customer leads and sales',
  finance: 'Process loan applications',
  inspection: 'Conduct vehicle inspections',
  user: 'Browse and purchase cars',
  dealer_staff: 'Manage dealer inventory and leads'
};
