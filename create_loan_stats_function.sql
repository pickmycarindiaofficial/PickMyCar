-- Create function to get loan application statistics
CREATE OR REPLACE FUNCTION get_loan_application_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_count integer;
  pending_count integer;
  approved_count integer;
  rejected_count integer;
  total_approved_amount numeric;
  avg_processing_time numeric;
BEGIN
  -- Get counts by status
  SELECT COUNT(*) INTO total_count FROM loan_applications;
  SELECT COUNT(*) INTO pending_count FROM loan_applications WHERE status = 'pending';
  SELECT COUNT(*) INTO approved_count FROM loan_applications WHERE status = 'approved';
  SELECT COUNT(*) INTO rejected_count FROM loan_applications WHERE status = 'rejected';
  
  -- Get total approved amount
  SELECT COALESCE(SUM(approved_amount), 0) INTO total_approved_amount 
  FROM loan_applications 
  WHERE status = 'approved';
  
  -- Calculate average processing time (in days) for approved/rejected applications
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400), 0) INTO avg_processing_time
  FROM loan_applications 
  WHERE status IN ('approved', 'rejected');
  
  -- Build result JSON
  result := jsonb_build_object(
    'total_applications', total_count,
    'pending_count', pending_count,
    'approved_count', approved_count,
    'rejected_count', rejected_count,
    'total_approved_amount', total_approved_amount,
    'avg_processing_days', ROUND(avg_processing_time, 1)
  );
  
  RETURN result;
END;
$$;
