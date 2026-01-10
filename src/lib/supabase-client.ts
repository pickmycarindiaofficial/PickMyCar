// Wrapper for Supabase client to handle untyped tables
import { supabase as supabaseClient } from '@/integrations/supabase/client';

// @ts-ignore - Bypass type checking for tables not in generated types
export const supabase = supabaseClient;
