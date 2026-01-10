import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, carDetails } = await req.json();
    
    if (!type || !carDetails) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type and carDetails' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GeminiAPI');
    if (!GEMINI_API_KEY) {
      console.error('GeminiAPI not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let prompt = '';
    
    if (type === 'description') {
      prompt = `Generate a professional car listing description in bullet-point format for:
Brand: ${carDetails.brand}
Model: ${carDetails.model}
Variant: ${carDetails.variant}
Year: ${carDetails.year}
Kilometers: ${carDetails.kms}
Fuel: ${carDetails.fuel}
Transmission: ${carDetails.transmission}
Color: ${carDetails.color}
Condition: ${carDetails.condition}

Format as 8-10 bullet points starting with * (asterisk):
- First bullet: Full car name with variant and color (e.g., * 2025 Maruti Baleno RS Delta – Silver)
- Second bullet: Key specs with pipes (e.g., * Just 25,000 km | Diesel | Automatic)
- Include warranty status if recent year/low kilometers
- Mention condition and maintenance quality
- Highlight key features and benefits
- Add loan availability mention with financing details
- Add service history availability mention
- End with a call-to-action line WITHOUT a bullet (e.g., "Book your test drive today – clean car, great deal!")

Example format:
* 2025 Maruti Baleno RS Delta – Silver
* Just 25,000 km | Diesel | Automatic
* Still under manufacturer warranty
* Excellent condition, well maintained
* Spacious, feature-packed, fuel efficient
* Ready to drive – no extra work needed
* Loan Available: Up to 90% finance, low EMI options
* Service History: Available

Book your test drive today – clean car, great deal!

Return ONLY the bullet points in this exact format.`;
    } else if (type === 'highlights') {
      prompt = `Generate 8-12 concise, impactful highlights for this car listing:
Brand: ${carDetails.brand}
Model: ${carDetails.model}
Variant: ${carDetails.variant}
Year: ${carDetails.year}
Kilometers: ${carDetails.kms}
Fuel: ${carDetails.fuel}
Transmission: ${carDetails.transmission}
Color: ${carDetails.color}
Condition: ${carDetails.condition}
Owner: ${carDetails.owner}

Requirements:
- Each highlight should be 3-6 words
- Focus on selling points
- Include condition, ownership, service history if applicable
- Be specific and factual
- No marketing fluff

Return as a JSON array of strings, e.g.: ["Well maintained", "Single owner", "Full service history"]`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Must be "description" or "highlights"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Gemini API with type:', type);

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: type === 'description' ? 500 : 300,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Gemini API response received');

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error('No text in Gemini response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'No content generated. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: any;
    
    if (type === 'highlights') {
      try {
        // Try to parse as JSON array
        const cleaned = generatedText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
        result = { highlights: JSON.parse(cleaned) };
      } catch {
        // Fallback: split by newlines and clean up
        const highlights = generatedText
          .split('\n')
          .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
          .filter((line: string) => line.length > 0 && line.length < 100)
          .slice(0, 12);
        result = { highlights };
      }
    } else {
      result = { description: generatedText.trim() };
    }

    console.log('Successfully generated content for type:', type);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
