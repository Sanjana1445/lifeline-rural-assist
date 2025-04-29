
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
            model: "default",
            enableAutomaticPunctuation: true,
            useEnhanced: true, // Better quality transcription
          },
          audio: {
            content: base64Audio,
          },
        }),
      });
      
      debugLog("Received API response", { status: response.status });
      
      if (!response.ok) {
        const errorText = await response.text();
        debugLog("Speech-to-Text API error", { status: response.status, error: errorText });
        throw new Error(`Speech-to-Text API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        debugLog("Speech-to-Text API returned error", data.error);
        throw new Error(data.error.message || "Speech recognition failed");
      }
      
      const transcript = data.results?.[0]?.alternatives?.[0]?.transcript || "";
      // Get detected language if available
      const language = data.results?.[0]?.languageCode?.split('-')?.[0] || "english";
      
      debugLog("Transcription successful", { 
        language,
        textLength: transcript.length,
        text: transcript.substring(0, 100)
      });
      
      return new Response(
        JSON.stringify({ transcript, language }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (apiError) {
      debugLog("Error calling Speech-to-Text API", apiError);
      throw apiError;
    }
  } catch (error) {
    debugLog("Error in voice-to-text function", { message: error.message });
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to process audio",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
