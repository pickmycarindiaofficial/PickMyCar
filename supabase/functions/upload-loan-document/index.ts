import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const token = formData.get('token') as string;
    const documentType = formData.get('documentType') as string;
    const file = formData.get('file') as File;

    if (!token || !documentType || !file) {
      throw new Error('Missing required fields');
    }

    console.log('📤 Uploading document:', { token, documentType, fileName: file.name });

    // Verify token and get application
    const { data: application, error: fetchError } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('upload_token', token)
      .single();

    if (fetchError || !application) {
      throw new Error('Invalid or expired token');
    }

    // Check if token is expired
    if (new Date(application.upload_token_expires_at) < new Date()) {
      throw new Error('Upload link has expired. Please contact finance team.');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only PDF, JPG, and PNG files are allowed');
    }

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${application.id}/${documentType}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('loan-documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      throw new Error('Failed to upload file');
    }

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('loan_documents')
      .insert({
        application_id: application.id,
        document_type: documentType,
        document_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ Error creating document record:', docError);
      throw docError;
    }

    // Check if all required documents are uploaded
    const { data: allDocs } = await supabase
      .from('loan_documents')
      .select('document_type')
      .eq('application_id', application.id);

    const requiredDocs = ['aadhaar', 'pan', 'salary_proof'];
    const uploadedTypes = allDocs?.map(d => d.document_type) || [];
    const allRequiredUploaded = requiredDocs.every(type => uploadedTypes.includes(type));

    // Update application status if all docs uploaded
    if (allRequiredUploaded && application.status === 'document_pending') {
      await supabase
        .from('loan_applications')
        .update({ status: 'docs_received' })
        .eq('id', application.id);

      console.log('✅ All documents uploaded, status updated to docs_received');
    }

    console.log('✅ Document uploaded successfully:', document.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          documentId: document.id,
          documentType: document.document_type,
          allDocsUploaded: allRequiredUploaded,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in upload-loan-document:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
