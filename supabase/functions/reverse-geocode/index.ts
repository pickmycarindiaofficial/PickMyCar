import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, userId } = await req.json();

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    // Use OpenStreetMap Nominatim API (free, no API key needed)
    const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    
    const response = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'PickMyCar/1.0', // Required by Nominatim
      },
    });

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    const address = data.address || {};

    const cityName = address.city || address.town || address.village || address.state_district || 'Unknown';
    const stateName = address.state || 'Unknown';
    const country = address.country || 'India';

    // Update user_profile with location data
    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { error: updateError } = await supabase
        .from('user_profile')
        .upsert({
          user_id: userId,
          latitude,
          longitude,
          city_name: cityName,
          state_name: stateName,
          country,
          location_updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (updateError) {
        console.error('Error updating user profile:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        location: {
          latitude,
          longitude,
          city: cityName,
          state: stateName,
          country,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
