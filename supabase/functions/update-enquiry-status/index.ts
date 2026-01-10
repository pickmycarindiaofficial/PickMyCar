import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const enquiryId = url.searchParams.get('enquiryId');
    const status = url.searchParams.get('status');

    if (!enquiryId || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing enquiryId or status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Update Status Function - Processing:', { enquiryId, status });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update enquiry status
    const { data, error } = await supabase
      .from('car_enquiries')
      .update({
        status: status === 'contacted' ? 'contacted' : 'new',
        contacted_at: status === 'contacted' ? new Date().toISOString() : undefined,
        dealer_notes: status === 'contact_soon' ? 'Will contact soon' : undefined,
      })
      .eq('id', enquiryId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating enquiry:', error);
      throw error;
    }

    console.log('✅ Enquiry status updated:', data);

    // Return success HTML page (mobile-friendly)
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Status Updated</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .card {
              background: white;
              border-radius: 20px;
              padding: 40px;
              text-align: center;
              max-width: 400px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              color: #667eea;
              margin: 0 0 10px 0;
            }
            p {
              color: #666;
              margin: 0;
            }
            .status {
              display: inline-block;
              padding: 8px 16px;
              background: #667eea;
              color: white;
              border-radius: 20px;
              margin-top: 20px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h1>Status Updated!</h1>
            <p>Lead status has been updated successfully</p>
            <div class="status">${status === 'contacted' ? 'Contacted' : 'Contact Soon'}</div>
          </div>
        </body>
      </html>
    `;

    return new Response(successHtml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('❌ Error in update-enquiry-status function:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
          <style>
            body {
              font-family: sans-serif;
              background: #f5f5f5;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .card {
              background: white;
              border-radius: 10px;
              padding: 30px;
              text-align: center;
              max-width: 400px;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">❌</div>
            <h2>Error</h2>
            <p>${(error as Error).message}</p>
          </div>
        </body>
      </html>
    `;

    return new Response(errorHtml, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });
  }
});
