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

    // Try DeepSeek first, then Gemini as fallback
    const DEEPSEEK_API_KEY = Deno.env.get('DeepSeekAPI');
    const GEMINI_API_KEY = Deno.env.get('GeminiAPI');

    if (!DEEPSEEK_API_KEY && !GEMINI_API_KEY) {
      console.error('No AI API keys configured');
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

    let generatedText = '';
    let apiUsed = '';

    // Try DeepSeek first if available
    if (DEEPSEEK_API_KEY) {
      console.log('Calling DeepSeek API with type:', type);

      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: type === 'description' ? 500 : 300,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data.choices?.[0]?.message?.content || '';
          apiUsed = 'DeepSeek';
          console.log('DeepSeek API response received');
        } else {
          const errorText = await response.text();
          console.error('DeepSeek API error:', response.status, errorText);
        }
      } catch (e) {
        console.error('DeepSeek API exception:', e);
      }
    }

    // Fallback to Gemini if DeepSeek failed or not available
    if (!generatedText && GEMINI_API_KEY) {
      console.log('Trying Gemini API as fallback...');

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: type === 'description' ? 500 : 300,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          apiUsed = 'Gemini';
          console.log('Gemini API response received');
        } else {
          const errorText = await response.text();
          console.error('Gemini API error:', response.status, errorText);
        }
      } catch (e) {
        console.error('Gemini API exception:', e);
      }
    }

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate content from AI services. Please try again.' }),
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

    console.log(`Successfully generated content using ${apiUsed} for type:`, type);

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
