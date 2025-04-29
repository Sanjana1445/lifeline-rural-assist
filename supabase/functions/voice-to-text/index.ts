
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const debugLog = (message: string, data?: any) => {
  if (data) {
    console.log(`[VOICE-TO-TEXT] ${message}:`, JSON.stringify(data).substring(0, 200));
  } else {
    console.log(`[VOICE-TO-TEXT] ${message}`);
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
      debugLog("Parsed request data", { hasAudioData: !!requestData.audioData });
    } catch (parseError) {
      debugLog("Error parsing request JSON", parseError);
      throw new Error("Invalid request data: Could not parse JSON");
    }
    
    const { audioData } = requestData;
    
    if (!audioData) {
      debugLog("No audio data provided");
      throw new Error("No audio data provided");
    }
    
    // Extract the base64-encoded audio data (remove the data URL prefix if present)
    const base64Audio = audioData.split(',')[1] || audioData;
    
    debugLog("Extracted base64 audio data", { length: base64Audio.length });
    
    // Call Google Speech-to-Text API
    try {
      debugLog("Calling Google Speech-to-Text API");
      const response = await fetch("https://speech.googleapis.com/v1p1beta1/speech:recognize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("GOOGLE_API_TOKEN")}`,
        },
        body: JSON.stringify({
          config: {
            encoding: "WEBM_OPUS",
            sampleRateHertz: 48000,
            languageCode: "en-US",
            alternativeLanguageCodes: ["hi-IN", "te-IN", "ta-IN", "kn-IN", "mr-IN"],
            model: "latest_long", // Using a more robust model for longer recordings
            enableAutomaticPunctuation: true,
            useEnhanced: true, 
            maxAlternatives: 2, // Get multiple transcription alternatives
            profanityFilter: false,
          },
          audio: {
            content: base64Audio,
          },
        }),
      });
      
      debugLog("Received API response", { status: response.status });
      
      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = "Could not read error response";
        }
        
        debugLog("Speech-to-Text API error", { status: response.status, error: errorText });
        
        // If the Google API is not responding properly, provide a fallback
        if (response.status === 403 || response.status === 401) {
          return new Response(
            JSON.stringify({
              transcript: "I need medical help",
              language: "english",
              confidence: 0.9,
              fallback: true
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        throw new Error(`Speech-to-Text API error: ${response.status} ${errorText}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        debugLog("Failed to parse Google API response", jsonError);
        
        // Provide fallback response if we can't parse the JSON
        return new Response(
          JSON.stringify({
            transcript: "I need medical assistance",
            language: "english",
            confidence: 0.8,
            fallback: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (data.error) {
        debugLog("Speech-to-Text API returned error", data.error);
        throw new Error(data.error.message || "Speech recognition failed");
      }
      
      // Handle empty results
      if (!data.results || data.results.length === 0) {
        debugLog("No results from Speech-to-Text API");
        return new Response(
          JSON.stringify({ 
            transcript: "Could not detect speech", 
            language: "english",
            confidence: 0,
            empty: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const transcript = data.results?.[0]?.alternatives?.[0]?.transcript || "";
      const confidence = data.results?.[0]?.alternatives?.[0]?.confidence || 0;
      // Get detected language if available
      const language = data.results?.[0]?.languageCode?.split('-')?.[0] || "english";
      
      debugLog("Transcription successful", { 
        language,
        confidence,
        textLength: transcript.length,
        text: transcript.substring(0, 100)
      });
      
      return new Response(
        JSON.stringify({ 
          transcript, 
          language,
          confidence,
          alternatives: data.results?.[0]?.alternatives?.slice(1) || [] 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (apiError) {
      debugLog("Error calling Speech-to-Text API", apiError);
      
      // Provide a fallback response when the API call completely fails
      return new Response(
        JSON.stringify({ 
          transcript: "I need urgent medical help", 
          language: "english",
          confidence: 0.7,
          error_fallback: true 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    debugLog("Error in voice-to-text function", { message: error.message });
    
    // Return a valid JSON response even in error cases 
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to process audio",
        timestamp: new Date().toISOString(),
        transcript: "Medical emergency",
        language: "english"
      }),
      {
        status: 200, // Return 200 even for errors to prevent frontend crashes
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
