-- Create loan_applications table
CREATE TABLE IF NOT EXISTS public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  city_id UUID REFERENCES public.cities(id),
  car_listing_id UUID REFERENCES public.car_listings(id) ON DELETE SET NULL,
  car_brand TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_variant TEXT,
  car_price NUMERIC NOT NULL,
  monthly_income NUMERIC NOT NULL,
  existing_loans BOOLEAN DEFAULT false,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('salaried', 'self_employed', 'business')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'document_pending', 'docs_received', 'bank_underwriting', 'approved', 'rejected')),
  upload_token TEXT UNIQUE,
  upload_token_expires_at TIMESTAMPTZ,
  approved_amount NUMERIC,
  interest_rate NUMERIC,
  tenure_months INTEGER,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loan_documents table
CREATE TABLE IF NOT EXISTS public.loan_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('aadhaar', 'pan', 'salary_proof')),
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, document_type)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON public.loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON public.loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_upload_token ON public.loan_applications(upload_token);
CREATE INDEX IF NOT EXISTS idx_loan_documents_application_id ON public.loan_documents(application_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_loan_application_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_loan_application_updated_at ON public.loan_applications;
CREATE TRIGGER set_loan_application_updated_at
  BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_application_timestamp();

-- RLS Policies for loan_applications
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view their own loan applications"
  ON public.loan_applications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users can create their own loan applications"
  ON public.loan_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Powerdesk users can view all applications
CREATE POLICY "Powerdesk can view all loan applications"
  ON public.loan_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'powerdesk'
    )
  );

-- Powerdesk users can update applications
CREATE POLICY "Powerdesk can update loan applications"
  ON public.loan_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'powerdesk'
    )
  );

-- RLS Policies for loan_documents
ALTER TABLE public.loan_documents ENABLE ROW LEVEL SECURITY;

-- Users can view documents for their own applications
CREATE POLICY "Users can view their own loan documents"
  ON public.loan_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loan_applications
      WHERE id = loan_documents.application_id
      AND user_id = auth.uid()
    )
  );

-- Users can insert documents for their own applications
CREATE POLICY "Users can upload their own loan documents"
  ON public.loan_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loan_applications
      WHERE id = loan_documents.application_id
      AND user_id = auth.uid()
    )
  );

-- Powerdesk can view all documents
CREATE POLICY "Powerdesk can view all loan documents"
  ON public.loan_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'powerdesk'
    )
  );

-- Create storage bucket for loan documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for loan-documents bucket
CREATE POLICY "Users can upload their loan documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'loan-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own loan documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'loan-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Powerdesk can view all loan documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'loan-documents' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'powerdesk'
    )
  );
