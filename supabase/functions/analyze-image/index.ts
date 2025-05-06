
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
    const GEMINI_API_KEY = "AIzaSyAYrqaXVYsj3LZP26PocWYAG9ewDRxOB5w";
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error("No image provided");
    }
    
    // Remove data URL prefix if present
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;
    
    // Determine the MIME type
    let mimeType = "image/jpeg";
    if (imageBase64.includes('data:')) {
      const matches = imageBase64.match(/data:([^;]+);/);
      if (matches && matches.length > 1) {
        mimeType = matches[1];
      }
    }
    
    // Configure Gemini API request
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Analyze this medical image and provide an assessment. Identify any visible injuries, conditions, or medical emergencies. Then provide a clear explanation of what should be done as first aid steps or immediate actions. Format your response with two sections: 1) What you observe (the potential medical issue), and 2) First aid recommendations and when to seek professional help."
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generation_config: {
          temperature: 0.2,
          top_p: 0.8,
          top_k: 40
        }
      })
    });
    
    const data = await response.json();
    let analysisResult = "Could not analyze the image.";
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      analysisResult = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    return new Response(
      JSON.stringify({ analysis: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to analyze image", 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
