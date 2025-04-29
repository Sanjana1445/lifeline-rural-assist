
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const GEMINI_VISION_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";

const debugLog = (message: string, data?: any) => {
  if (data) {
    console.log(`[GEMINI-CHAT] ${message}:`, JSON.stringify(data).substring(0, 200));
  } else {
    console.log(`[GEMINI-CHAT] ${message}`);
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    debugLog("Received request");
    
    let requestData;
    try {
      requestData = await req.json();
      debugLog("Parsed request data", { 
        hasPrompt: !!requestData.prompt, 
        hasImage: !!requestData.image,
        language: requestData.language || 'english'
      });
    } catch (parseError) {
      debugLog("Error parsing request JSON", parseError);
      throw new Error("Invalid request data: Could not parse JSON");
    }
    
    const { prompt, image, language, history = [] } = requestData;
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      debugLog("GEMINI_API_KEY is not set");
      throw new Error("GEMINI_API_KEY is not set");
    }
    
    // Prepare system instructions based on use case
    let systemPrompt = "You are a medical assistant AI. Provide helpful medical guidance based on the user's questions or images. Always advise seeing a doctor for serious concerns.";
    
    // Add language instruction if non-English detected
    if (language && language !== "english") {
      systemPrompt += ` Respond in the ${language} language.`;
    }
    
    // Include conversation history
    const conversationHistory = history.map(msg => {
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      };
    });
    
    // Add system prompt and current user prompt
    const contents = [
      { role: "model", parts: [{ text: systemPrompt }] },
      ...conversationHistory,
    ];
    
    // Add the current user prompt
    if (prompt || image) {
      const userParts = [];
      
      if (prompt) {
        userParts.push({ text: prompt });
      }
      
      if (image) {
        // Extract base64 image data (remove prefix)
        const base64Image = image.split(',')[1] || image;
        userParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        });
      }
      
      contents.push({ role: "user", parts: userParts });
    }
    
    // Choose endpoint based on content type
    const endpoint = image ? GEMINI_VISION_ENDPOINT : GEMINI_ENDPOINT;
    
    debugLog("Making request to Gemini API", { endpoint });
    
    try {
      // Make request to Gemini API
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.4,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });
  
      debugLog("Received Gemini API response", { status: response.status });
      
      if (!response.ok) {
        const errorText = await response.text();
        debugLog("Gemini API error", { status: response.status, error: errorText });
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      debugLog("Generated response", { textLength: generatedText.length });
      
      return new Response(JSON.stringify({ text: generatedText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (apiError) {
      debugLog("Error calling Gemini API", apiError);
      throw apiError;
    }
  } catch (error) {
    debugLog("Error in gemini-chat function", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process request" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
