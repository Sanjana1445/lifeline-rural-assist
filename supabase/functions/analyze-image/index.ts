
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
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyAYrqaXVYsj3LZP26PocWYAG9ewDRxOB5w";
    const requestUrl = new URL(req.url);
    console.log("Function URL:", requestUrl.toString());
    
    // Parse request body
    let imageBase64;
    try {
      const requestData = await req.json();
      imageBase64 = requestData.imageBase64;
      console.log("Received request with image data length:", imageBase64 ? imageBase64.length : 0);
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      throw new Error("Invalid request format: Could not parse JSON");
    }
    
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
    
    console.log("Making Gemini API request with image...", {
      mimeType, 
      imageDataLength: base64Data.length
    });
    
    // Configure Gemini API request with proper error handling
    try {
      // Using the appropriate Gemini API URL for vision processing
      const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;
      console.log("Using Gemini API URL:", geminiUrl);
      
      const response = await fetch(geminiUrl, {
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
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error response:", errorText);
        throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
      }
      
      const responseText = await response.text();
      console.log("Gemini API raw response:", responseText.substring(0, 200) + "...");
      
      // Safely parse the JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse Gemini API response:", parseError);
        console.error("Response that failed to parse:", responseText.substring(0, 500));
        throw new Error("Invalid JSON response from Gemini API");
      }
      
      let analysisResult = "Could not analyze the image.";
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        analysisResult = data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        console.error("Structured error from Gemini API:", data.error);
        throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
      } else {
        console.error("Unexpected Gemini API response structure:", JSON.stringify(data, null, 2).substring(0, 500));
        throw new Error("Unexpected response format from Gemini API");
      }
      
      return new Response(
        JSON.stringify({ analysis: analysisResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (geminiError) {
      console.error("Error during Gemini API call:", geminiError);
      throw new Error(`Failed to process image with Gemini API: ${geminiError.message}`);
    }
    
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
