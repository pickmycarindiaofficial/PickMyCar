-- =====================================================
-- LOAN APPLICATION SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================

-- Create loan application status enum
CREATE TYPE loan_application_status AS ENUM (
  'new_lead',
  'document_pending',
  'docs_received',
  'bank_underwriting',
  'approved',
  'rejected',
  'cancelled'
);

-- Create document type enum
CREATE TYPE loan_document_type AS ENUM (
  'aadhaar',
  'pan',
  'salary_proof',
  'bank_statement',
  'other'
);

-- =====================================================
-- TABLE: loan_applications
-- =====================================================
CREATE TABLE loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT UNIQUE NOT NULL,
  
  -- User information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
  
  -- Car information
  car_listing_id UUID REFERENCES car_listings(id) ON DELETE SET NULL,
  car_brand TEXT,
  car_model TEXT,
  car_variant TEXT,
  car_price NUMERIC NOT NULL,
  
  -- Financial information (Step 1 - Lightweight)
  monthly_income NUMERIC NOT NULL,
  existing_loans BOOLEAN DEFAULT false,
  employment_type TEXT, -- salaried, self_employed, business
  
  -- Loan details (filled by finance team)
  requested_loan_amount NUMERIC,
  approved_loan_amount NUMERIC,
  interest_rate NUMERIC,
  tenure_months INTEGER,
  
  -- Status tracking
  status loan_application_status NOT NULL DEFAULT 'new_lead',
  status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Document upload link
  upload_token TEXT UNIQUE,
  upload_token_expires_at TIMESTAMP WITH TIME ZONE,
  upload_link_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Additional fields
  rejection_reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Source tracking
  source TEXT DEFAULT 'website',
  referrer_url TEXT,
  ip_address TEXT,
  user_agent TEXT
);

-- =====================================================
-- TABLE: loan_documents
-- =====================================================
CREATE TABLE loan_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  
  -- Document details
  document_type loan_document_type NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  
  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- TABLE: loan_application_status_history
-- =====================================================
CREATE TABLE loan_application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  
  -- Status change
  from_status loan_application_status,
  to_status loan_application_status NOT NULL,
  
  -- Change details
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- TABLE: loan_application_notes
-- =====================================================
CREATE TABLE loan_application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  
  -- Note details
  note_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  
  -- Author
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- SEQUENCES AND FUNCTIONS
-- =====================================================

-- Sequence for application numbers
CREATE SEQUENCE loan_application_sequence START 1;

-- Function to generate application number
CREATE OR REPLACE FUNCTION generate_loan_application_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  date_part TEXT;
  seq_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  seq_part := LPAD(nextval('loan_application_sequence')::TEXT, 4, '0');
  RETURN 'LA-' || date_part || '-' || seq_part;
END;
$$;

-- Trigger to auto-generate application number
CREATE OR REPLACE FUNCTION set_loan_application_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.application_number IS NULL THEN
    NEW.application_number := generate_loan_application_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_loan_application_number
BEFORE INSERT ON loan_applications
FOR EACH ROW
EXECUTE FUNCTION set_loan_application_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_loan_application_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_loan_application_timestamp
BEFORE UPDATE ON loan_applications
FOR EACH ROW
EXECUTE FUNCTION update_loan_application_timestamp();

-- Trigger to track status changes
CREATE OR REPLACE FUNCTION track_loan_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO loan_application_status_history (
      application_id,
      from_status,
      to_status,
      changed_by,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      NOW()
    );
    
    NEW.status_updated_at = NOW();
    NEW.status_updated_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_track_loan_status_change
BEFORE UPDATE ON loan_applications
FOR EACH ROW
EXECUTE FUNCTION track_loan_status_change();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX idx_loan_applications_car_listing_id ON loan_applications(car_listing_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_loan_applications_created_at ON loan_applications(created_at DESC);
CREATE INDEX idx_loan_applications_application_number ON loan_applications(application_number);
CREATE INDEX idx_loan_applications_upload_token ON loan_applications(upload_token) WHERE upload_token IS NOT NULL;

CREATE INDEX idx_loan_documents_application_id ON loan_documents(application_id);
CREATE INDEX idx_loan_documents_document_type ON loan_documents(document_type);
CREATE INDEX idx_loan_documents_is_verified ON loan_documents(is_verified);

CREATE INDEX idx_loan_status_history_application_id ON loan_application_status_history(application_id);
CREATE INDEX idx_loan_status_history_changed_at ON loan_application_status_history(changed_at DESC);

CREATE INDEX idx_loan_notes_application_id ON loan_application_notes(application_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_application_notes ENABLE ROW LEVEL SECURITY;

-- loan_applications policies
CREATE POLICY "Users can create loan applications"
ON loan_applications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own loan applications"
ON loan_applications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Finance team can view all loan applications"
ON loan_applications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'::app_role));

CREATE POLICY "Finance team can update loan applications"
ON loan_applications FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'::app_role))
WITH CHECK (has_role(auth.uid(), 'powerdesk'::app_role));

CREATE POLICY "Public can create loan applications with token"
ON loan_applications FOR INSERT
TO anon
WITH CHECK (true);

-- loan_documents policies
CREATE POLICY "Users can view own loan documents"
ON loan_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM loan_applications
    WHERE loan_applications.id = loan_documents.application_id
    AND loan_applications.user_id = auth.uid()
  )
);

CREATE POLICY "Finance team can view all loan documents"
ON loan_documents FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'::app_role));

CREATE POLICY "Finance team can manage loan documents"
ON loan_documents FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'::app_role))
WITH CHECK (has_role(auth.uid(), 'powerdesk'::app_role));

CREATE POLICY "System can insert loan documents"
ON loan_documents FOR INSERT
TO authenticated
WITH CHECK (true);

-- loan_application_status_history policies
CREATE POLICY "Users can view own status history"
ON loan_application_status_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM loan_applications
    WHERE loan_applications.id = loan_application_status_history.application_id
    AND loan_applications.user_id = auth.uid()
  )
);

CREATE POLICY "Finance team can view all status history"
ON loan_application_status_history FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'::app_role));

CREATE POLICY "System can insert status history"
ON loan_application_status_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- loan_application_notes policies
CREATE POLICY "Finance team can view all notes"
ON loan_application_notes FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'::app_role));

CREATE POLICY "Finance team can create notes"
ON loan_application_notes FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'powerdesk'::app_role));

CREATE POLICY "Finance team can update notes"
ON loan_application_notes FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'powerdesk'::app_role))
WITH CHECK (has_role(auth.uid(), 'powerdesk'::app_role));

-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================

-- Create storage bucket for loan documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for loan-documents bucket
CREATE POLICY "Finance team can view all loan documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'loan-documents'
  AND has_role(auth.uid(), 'powerdesk'::app_role)
);

CREATE POLICY "Authenticated users can upload loan documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'loan-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own loan documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'loan-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get loan application statistics
CREATE OR REPLACE FUNCTION get_loan_application_stats()
RETURNS TABLE (
  total_applications BIGINT,
  new_leads BIGINT,
  document_pending BIGINT,
  docs_received BIGINT,
  bank_underwriting BIGINT,
  approved BIGINT,
  rejected BIGINT,
  total_approved_amount NUMERIC,
  avg_processing_time_days NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::BIGINT as total_applications,
    COUNT(*) FILTER (WHERE status = 'new_lead')::BIGINT as new_leads,
    COUNT(*) FILTER (WHERE status = 'document_pending')::BIGINT as document_pending,
    COUNT(*) FILTER (WHERE status = 'docs_received')::BIGINT as docs_received,
    COUNT(*) FILTER (WHERE status = 'bank_underwriting')::BIGINT as bank_underwriting,
    COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected,
    COALESCE(SUM(approved_loan_amount) FILTER (WHERE status = 'approved'), 0) as total_approved_amount,
    COALESCE(AVG(EXTRACT(EPOCH FROM (status_updated_at - created_at)) / 86400) FILTER (WHERE status IN ('approved', 'rejected')), 0) as avg_processing_time_days
  FROM loan_applications
  WHERE has_role(auth.uid(), 'powerdesk'::app_role);
$$;

-- Function to check if upload token is valid
CREATE OR REPLACE FUNCTION is_upload_token_valid(token TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM loan_applications
    WHERE upload_token = token
    AND upload_token_expires_at > NOW()
  );
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SEQUENCE loan_application_sequence TO authenticated, anon;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE loan_applications IS 'Stores loan application leads from Step 1 and tracks full lifecycle';
COMMENT ON TABLE loan_documents IS 'Stores uploaded KYC documents from Step 2';
COMMENT ON TABLE loan_application_status_history IS 'Tracks all status changes for audit trail';
COMMENT ON TABLE loan_application_notes IS 'Internal notes by finance team';
COMMENT ON FUNCTION generate_loan_application_number() IS 'Generates unique application number in format LA-YYYYMMDD-XXXX';
COMMENT ON FUNCTION track_loan_status_change() IS 'Automatically records status changes in history table';
